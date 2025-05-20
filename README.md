## My Macros App - Full Implementation Guide

This guide outlines the entire setup of a mobile-first, password-protected web app that estimates the macros of a meal based on a photo using the Anthropic Claude 3 API. The app includes a secure backend and a responsive frontend, suitable for deployment on platforms like Vercel.

---

## Backend Implementation (Node.js with Express + Swagger Docs)

### Milestone 1: Project Setup
1. Use Node.js with Express for backend development:
   ```bash
   npm init -y
   npm install express formidable dotenv swagger-jsdoc swagger-ui-express
   ```
2. Project structure:
   ```
   backend/
   ├── api/
   │   └── estimate.js
   ├── routes/
   │   ├── estimateRoute.js
   │   └── verifyRoute.js
   ├── swagger/
   │   └── swaggerConfig.js
   ├── .env
   ├── app.js
   └── package.json
   ```

### Milestone 2: Secure Environment Configuration
1. Store your Claude API key and password in `.env`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   APP_PASSWORD=2911
   ```
2. Load them using `dotenv` in `app.js` and route files as needed.

### Milestone 3: Route Handling and Claude API Integration
1. In `estimateRoute.js`, parse image uploads with `formidable`.
2. Upload image to a temporary file hosting service (e.g., Cloudinary, S3).
3. Build the prompt string based on the `mode` (`basic` or `detailed`).
4. Send the image and prompt to Claude 3 API and return structured JSON to the frontend.
5. In `verifyRoute.js`, implement a `/verify` endpoint:
   - Accept a password from the frontend
   - Compare against `APP_PASSWORD`
   - Return 200 if valid, 401 if not

### Milestone 4: Swagger Documentation
1. Use `swagger-jsdoc` and `swagger-ui-express` to auto-generate API docs.
2. Define Swagger schema in `swagger/swaggerConfig.js`.
3. Document both `/estimate` and `/verify` endpoints.
4. Mount Swagger UI in your Express app under `/docs`:
   ```js
   const swaggerUi = require('swagger-ui-express');
   const swaggerSpec = require('./swagger/swaggerConfig');
   app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
   ```

### Milestone 5: Deployment
1. Use Vercel's `api/` directory to wrap Express in serverless functions **or** host the Express server on another platform (e.g., Render, Railway).
2. Ensure HTTPS and enable CORS if hosted outside Vercel.
3. Secure sensitive endpoints and implement rate limiting where needed.

---

## Frontend Implementation (Mobile-First, HTTPS-Only)

### Milestone 1: Project Initialization and Layout
1. Create a `frontend` directory with a React-based structure:
   ```
   frontend/
   ├── public/index.html
   ├── src/
   │   ├── App.js
   │   ├── Keypad.js
   │   ├── styles.css
   │   └── index.js
   └── package.json
   ```
2. Initialize React using `npm create vite@latest` or `create-react-app`.

### Milestone 2: User Interaction Flow
1. When the app loads, show the password screen first.
2. Render a `Keypad` component where the user can enter a 4-digit PIN, displayed as masked characters.
3. Below the keypad, include the message: "Don't know the password? [Contact here](#)" where the hyperlink can later be customized.
4. If the input password matches the expected value, proceed to the image upload screen.
5. In `App.js`, implement a file input that accepts image uploads.
6. Store the image file in state.

### Milestone 3: Backend Communication and Results Display
1. On successful password entry, send a `POST` request to the backend with the image and mode (`basic` or `detailed`).
2. Display a loading indicator.
3. Show the uploaded image and macro estimates. If in detailed mode, also show identified ingredients.
4. On the results page, include only a “Done” button that redirects the user back to the home page.

### Milestone 4: Deployment and Styling
1. Ensure secure HTTPS communication using `fetch`.
2. Use media queries and flexible layouts for mobile responsiveness.
3. Deploy to Vercel or Netlify.
4. Apply a dark theme using:
   - Background: `#121212`
   - Text: `#ffffff` or `#e0e0e0`
   - Accent: `#00bfa5` or `#ff9800`
   - Use `prefers-color-scheme: dark` for auto dark mode adaptation

---
