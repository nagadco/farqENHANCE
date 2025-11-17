const { WebClient } = require('@slack/web-api');
const axios = require('axios');

class SlackHelper {
  constructor() {
    this.client = null;
    this.channelId = process.env.SLACK_CHANNEL_ID;

    // Initialize Slack client only if token is provided
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_BOT_TOKEN !== 'your_slack_bot_token_here') {
      this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
  }

  isEnabled() {
    return this.client !== null && this.channelId && this.channelId !== 'your_slack_channel_id_here';
  }

  formatComparisonMessage(requestData, response, processingTime) {
    const { latitude, longitude, maxChefs, page, position } = requestData;

    // Create readable summary
    const summary = [
      `*🍽️ New Comparison Request*`,
      `📍 Location: \`${latitude}, ${longitude}\``,
      `👨‍🍳 Max Chefs: ${maxChefs}`,
      `📄 Page: ${page}, Position: ${position}`,
      `✅ Status: ${response.status}`,
      `🏪 Restaurants Found: ${response.total_processed}`,
      `⏱️ Processing Time: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)`,
      `⏰ Processed at: ${new Date(response.processed_at).toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })}`
    ].join('\n');

    // Format restaurant list
    let restaurantList = '';
    if (response.restaurants && response.restaurants.length > 0) {
      restaurantList = '\n\n*Restaurants:*\n';
      response.restaurants.forEach((restaurant, index) => {
        restaurantList += `${index + 1}. ${restaurant.name} - ⭐ ${restaurant.rating} (${restaurant.reviewCount} reviews)\n`;
      });
    }

    return summary + restaurantList;
  }

  formatDeliveryOptionsMessage(requestData, response, processingTime) {
    const { latitude, longitude, restaurantName } = requestData;

    // Create readable summary
    const summary = [
      `*🚚 Delivery Options Request*`,
      `🏪 Restaurant: *${response.restaurant_name}*`,
      `🆔 ID: \`${response.restaurant_id}\``,
      `📍 Location: \`${latitude}, ${longitude}\``,
      `✅ Status: ${response.status}`,
      `⏱️ Processing Time: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)`,
      `⏰ Processed at: ${new Date(response.processed_at).toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })}`
    ].join('\n');

    // Format delivery options
    let optionsList = '';
    if (response.delivery_options && response.delivery_options.length > 0) {
      optionsList = '\n\n*Delivery Options:*\n';
      response.delivery_options.forEach((option, index) => {
        const statusEmoji = option.status === 'success' ? '✅' : option.status === 'not_found' ? '❌' : '⚠️';
        const priceText = option.status === 'success' ? `${option.price} SAR` : option.errorMessage || 'N/A';
        optionsList += `${index + 1}. ${statusEmoji} *${option.name}* - ${priceText} ${option.isFree ? '(FREE)' : ''}\n`;
      });
    }

    return summary + optionsList;
  }

  formatErrorMessage(errorTitle, errorDetails, endpoint = '', requestData = {}) {
    const summary = [
      `*🚨 Error Alert*`,
      `❌ *${errorTitle}*`,
      endpoint ? `🔗 Endpoint: \`${endpoint}\`` : '',
      `⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })}`
    ].filter(Boolean).join('\n');

    let details = '';
    if (errorDetails) {
      details = '\n\n*Error Details:*\n```' + (typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)) + '```';
    }

    let request = '';
    if (requestData && Object.keys(requestData).length > 0) {
      request = '\n\n*Request Data:*\n```' + JSON.stringify(requestData, null, 2) + '```';
    }

    return summary + details + request;
  }

  async sendComparisonResult(requestData, response, processingTime = 0) {
    if (!this.isEnabled()) {
      console.log('⚠️ Slack is not configured or disabled');
      return null;
    }

    try {
      const readableMessage = this.formatComparisonMessage(requestData, response, processingTime);

      // Send main message
      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        text: readableMessage,
        unfurl_links: false,
        unfurl_media: false
      });

      console.log(`✅ Slack message sent: ${result.ts}`);

      // Send full JSON response as a file in the thread
      if (result.ts) {
        const fullResponse = JSON.stringify(response, null, 2);
        const filename = `comparison_${response.processed_at.replace(/[:.]/g, '-')}.json`;

        await this.client.files.uploadV2({
          channel_id: this.channelId,
          thread_ts: result.ts,
          file: Buffer.from(fullResponse, 'utf-8'),
          filename: filename,
          title: 'Full Response JSON',
          initial_comment: '📄 Full response data'
        });

        console.log(`✅ Full response sent as JSON file to thread`);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending Slack message:', error.message);
      return null;
    }
  }

  async sendDeliveryOptionsResult(requestData, response, processingTime = 0) {
    if (!this.isEnabled()) {
      console.log('⚠️ Slack is not configured or disabled');
      return null;
    }

    try {
      const readableMessage = this.formatDeliveryOptionsMessage(requestData, response, processingTime);

      // Send main message
      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        text: readableMessage,
        unfurl_links: false,
        unfurl_media: false
      });

      console.log(`✅ Slack message sent: ${result.ts}`);

      // Send full JSON response as a file in the thread
      if (result.ts) {
        const fullResponse = JSON.stringify(response, null, 2);
        const filename = `delivery_options_${response.restaurant_id}_${response.processed_at.replace(/[:.]/g, '-')}.json`;

        await this.client.files.uploadV2({
          channel_id: this.channelId,
          thread_ts: result.ts,
          file: Buffer.from(fullResponse, 'utf-8'),
          filename: filename,
          title: `Delivery Options - ${response.restaurant_name}`,
          initial_comment: '📄 Full response data'
        });

        console.log(`✅ Full response sent as JSON file to thread`);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending Slack message:', error.message);
      return null;
    }
  }

  async sendError(errorTitle, errorDetails, endpoint = '', requestData = {}) {
    if (!this.isEnabled()) {
      console.log('⚠️ Slack is not configured or disabled');
      return null;
    }

    try {
      const errorMessage = this.formatErrorMessage(errorTitle, errorDetails, endpoint, requestData);

      // Send error message
      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        text: errorMessage,
        unfurl_links: false,
        unfurl_media: false
      });

      console.log(`✅ Error notification sent to Slack: ${result.ts}`);
      return result;
    } catch (error) {
      console.error('❌ Error sending Slack error notification:', error.message);
      return null;
    }
  }
}

module.exports = SlackHelper;
