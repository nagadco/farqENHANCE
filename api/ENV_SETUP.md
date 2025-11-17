# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `/api` directory with the following variables:

```env
# TheChefz API Configuration
CHEFZ_AUTH_TOKEN=Bearer_your_auth_token_here
CHEFZ_PHPSESSID=your_phpsessid_here
CHEFZ_CSRF=your_csrf_token_here

# Production-specific tokens (for Render deployment)
CHEFZ_AUTH_TOKEN_PROD=Bearer_your_production_auth_token_here
CHEFZ_PHPSESSID_PROD=your_production_phpsessid_here
CHEFZ_CSRF_PROD=your_production_csrf_token_here

# Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Gemini AI Configuration (Required for restaurant matching)
GEMINI_API_KEY=your_gemini_api_key_here
```


## How to Get Gemini API Key

⚠️ **Important**: You need a valid Gemini API key for restaurant matching to work.

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose your Google Cloud project (or create a new one)
5. Copy the generated API key and add it to your `.env` file

**If you get a 403 error:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable "Generative Language API" for your project
- You may need to enable billing for some models

## How to Get TheChefz Tokens

1. Open TheChefz website in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Make any request to the website
5. Look for requests to `api.thechefz.co`
6. Copy the following from request headers:
   - `Authorization` header value
   - `PHPSESSID` from cookies
   - `_csrf` from cookies

## Optional: Multiple Token Sets

For better reliability, you can set up multiple token sets:

```env
CHEFZ_AUTH_TOKEN_1=Bearer_first_token
CHEFZ_PHPSESSID_1=first_phpsessid
CHEFZ_CSRF_1=first_csrf

CHEFZ_AUTH_TOKEN_2=Bearer_second_token
CHEFZ_PHPSESSID_2=second_phpsessid
CHEFZ_CSRF_2=second_csrf
```

## Deployment on Render

Set these environment variables in your Render dashboard:
1. Go to your service settings
2. Navigate to Environment tab
3. Add the required variables
4. Redeploy your service

## Troubleshooting Render Issues

### Why it works on Ngrok but not on Render:

1. **IP Address Blocking**: TheChefz may block Render's IP addresses
2. **Different Environment**: Production vs Development settings
3. **Token Expiration**: Tokens may expire between deployments
4. **Rate Limiting**: Render may hit rate limits faster

### Solutions:

1. **Use Fresh Tokens**: Get new tokens specifically for production
2. **Check Logs**: Look at Render logs for detailed error messages
3. **Test Connection**: The API now includes connection testing
4. **Use Production Tokens**: Set `CHEFZ_*_PROD` variables for Render

### Debug Steps:

1. Check Render logs for connection test results
2. Verify all environment variables are set
3. Try different user agents (automatically rotated)
4. Check if TheChefz API is accessible from Render's IP
