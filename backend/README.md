# My Macros Backend

This is the serverless backend API for the My Macros app, which estimates macronutrients from food photos using the OpenAI Vision API.

## Setup & Deployment

### Prerequisites
- Node.js 18+ installed
- An OpenAI API key with access to GPT-4 Vision
- Vercel account (for deployment)
- Vercel CLI installed (`npm install -g vercel`)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   APP_PASSWORD=2911  # or your custom password
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at `http://localhost:3000/api/estimate`

### Deployment to Vercel

1. Set up your environment variables on Vercel:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `APP_PASSWORD`: The 4-digit PIN (default: 2911)

2. Deploy using Vercel CLI:
   ```bash
   vercel login
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

## API Usage

The API accepts POST requests to `/api/estimate` with the following parameters:

- `image`: The food image file (required)
- `password`: The 4-digit PIN (required)
- `mode`: Analysis mode - either `basic` or `detailed` (optional, defaults to `basic`)

### Example Response

```json
{
  "calories": 540,
  "protein": "30g",
  "carbs": "45g",
  "fat": "22g",
  "ingredients": ["grilled chicken", "rice", "broccoli"]  // only in detailed mode
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 400: Bad request (missing image, invalid file type, etc.)
- 401: Unauthorized (incorrect password)
- 405: Method not allowed (only POST is supported)
- 500: Internal server error

## Notes

- Maximum file size: 10MB
- Supported image formats: JPEG, PNG, WEBP, HEIC
- The API uses OpenAI's GPT-4 Vision model to analyze food images