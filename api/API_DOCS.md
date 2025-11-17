# Farq API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### POST /compare
Compare delivery fees between TheChefz and ToYou platforms.

**Request Body:**
```json
{
  "latitude": 24.7136,    // Required: Location latitude
  "longitude": 46.6753,   // Required: Location longitude
  "maxChefs": 6,          // Optional: Number of restaurants to fetch (default: 6)
  "page": 2,              // Optional: Starting page number (default: 2)
  "position": 0           // Optional: Starting position within page (default: 0)
}
```

**Response:**
```json
{
  "status": "completed",
  "processed_at": "2025-09-19T11:23:01.272Z",
  "restaurants": [
    {
      "name": "Restaurant Name",
      "rating": 4.7,
      "distance": "2.4km",
      "tags": ["Fast Food", "Shawarma"],
      "image": "https://...",
      "reviewCount": 29,
      "isClosed": false,
      "deliveryOptions": [
        {
          "name": "The Chefz",
          "time": "30-40mins",
          "price": "12",
          "isFree": false,
          "image": "/delivery_logos/the-chefs.png"
        },
        {
          "name": "To You",
          "time": "25-35mins",
          "price": "16",
          "isFree": false,
          "image": "/delivery_logos/to-you.png"
        }
      ],
      "toyouLogo": "https://..."  // ToYou merchant logo (if matched)
    }
  ],
  "total_processed": 2,
  "pagination": {
    "startPage": 2,
    "startPosition": 0,
    "lastPage": 2,
    "totalCollected": 2,
    "pagesScanned": 1,
    "nextPage": 2,
    "nextPosition": 2
  },
  "next_request": {
    "page": 2,
    "position": 2
  },
  "last_restaurant": {
    "id": 6930694,
    "name": "Restaurant Name"
  }
}
```

### GET /queue-status
Check the current processing queue status.

**Response:**
```json
{
  "queue_length": 0,
  "processing": false,
  "timestamp": "2025-09-19T11:23:01.272Z"
}
```

## Features

- **Queue Processing**: Requests are processed one at a time to avoid rate limiting
- **Smart Pagination**: Continues from exact position within pages, not just page boundaries
- **Data Enhancement**: Combines restaurant data from both TheChefz and ToYou APIs
- **Delivery Comparison**: Shows delivery fees and options from multiple platforms
- **Error Handling**: Graceful handling of API failures and missing data

## Usage Example

```bash
curl -X POST http://localhost:3000/compare \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 24.7136,
    "longitude": 46.6753,
    "maxChefs": 6,
    "page": 2,
    "position": 0
  }'
```

## Response Fields Explanation

### Restaurant Object
- `name`: Restaurant name from TheChefz
- `rating`: Restaurant rating (TheChefz primary, ToYou fallback)
- `distance`: Distance from specified location
- `tags`: Cuisine types and categories
- `image`: Restaurant image (TheChefz profilePicture or ToYou backgroundImage)
- `reviewCount`: Number of reviews from TheChefz
- `isClosed`: Restaurant availability status
- `deliveryOptions`: Array of available delivery services
- `toyouLogo`: ToYou merchant logo (if restaurant found on ToYou)

### Delivery Option Object
- `name`: Delivery service name ("The Chefz" or "To You")
- `time`: Estimated delivery time
- `price`: Delivery fee in SAR
- `isFree`: Boolean indicating if delivery is free
- `image`: Delivery service logo path

### Pagination Object
- `startPage`: Page number where collection started
- `startPosition`: Position within start page
- `nextPage`: Page number for next request
- `nextPosition`: Position within next page for continuation
- `totalCollected`: Number of restaurants collected
- `pagesScanned`: Number of pages processed

## Environment Variables Required

Create a `.env` file with the following variables:

```bash
# Server Configuration
PORT=3000

# TheChefz API Configuration
CHEFZ_AUTH_TOKEN=Bearer YOUR_CHEFZ_TOKEN_HERE
CHEFZ_PHPSESSID=YOUR_PHPSESSID_HERE
CHEFZ_CSRF=YOUR_CSRF_TOKEN_HERE

# ToYou API Configuration
TOYOU_AUTH_TOKEN=Bearer YOUR_TOYOU_AUTH_TOKEN_HERE
TOYOU_REFRESH_TOKEN=Bearer YOUR_TOYOU_REFRESH_TOKEN_HERE
TOYOU_AUTH_EXPIRATION_DATE=2025-01-08T12:45:20.000Z
TOYOU_REFRESH_EXPIRATION_DATE=2030-08-09T12:45:46.000Z
TOYOU_AUTH_EXPIRATION_PERIOD=3600
TOYOU_REFRESH_EXPIRATION_PERIOD=157680000
```