# My Macros - Frontend

A mobile-first, password-protected web app that estimates the macros of a meal based on a photo.

## Setup & Development

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

This will start the development server at http://localhost:3000.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_API_URL=http://localhost:3001/api/estimate
```

For production, these variables are set in the Vercel dashboard or in `.env.production`.

## Deployment

### Deploying to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

Alternatively, you can connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables on Vercel

Set the following environment variables in the Vercel dashboard:

- `VITE_API_URL`: Your API endpoint URL (e.g., `/api/estimate` if backend is on the same domain)

## Features

- Mobile-first interface
- Password protection with 4-digit PIN
- Image upload and processing
- Display of estimated macros (calories, protein, carbs, fat)
- Identified ingredients display
- Dark theme UI

## Password

The app uses a hardcoded password: `2911`

## API Communication

The frontend communicates with the backend API to process images. The API expects:
- A POST request to `/api/estimate`
- Form data with an `image` field containing the uploaded file
- Form data with a `password` field for authentication

## License

This project is licensed under the MIT License.