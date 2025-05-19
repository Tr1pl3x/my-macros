## My Macros
This outlines the entire setup of a mobile-first, password-protected web app that estimates the macros of a meal based on a photo using the Anthropic Claude 3 API. The app includes a secure backend and a responsive frontend, suitable for deployment on platforms like Vercel.

---

## Frontend Implementation (Mobile-First, HTTPS-Only)

### Iteration 2.1: Project Setup
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

### Iteration 2.2: Image Upload UI
1. In `App.js`, implement a file input that accepts image uploads.
2. Store the image file in state.
3. Once an image is uploaded, hide the input and move to the next step.

### Iteration 2.3: Password Gate With Keypad
1. Render a `Keypad` component after image upload.
2. Allow the user to enter a 4-digit PIN, displayed as masked characters (e.g., ●●●●).
3. If input password matches a hardcoded value (e.g., `2911`):
   - Proceed to send request.
4. If incorrect:
   - Show an error message: "Wrong password. Please try again."
   - Do not send request.

### Iteration 2.4: API Communication & Results
1. On password success, send a `POST` request to the backend:
   - Include the image file and optionally the password.
   - Optionally include a `mode` flag (e.g., `basic`, `detailed`) that determines what the AI returns.
2. Display a loading spinner while waiting.
3. On success, show the uploaded image and macro estimates.
4. If in `detailed` mode, also show detected ingredients and meal description.

### Iteration 2.5: Deployment Considerations
1. Use `fetch` over HTTPS to call the backend securely.
2. Ensure mobile responsiveness with `meta viewport`, and layout with flex/grid.
3. Deploy using Vercel or Netlify, linked to your backend endpoint.

### Iteration 2.6: Styling for Dark Theme
1. Set the background color to a dark shade (e.g., `#121212`) and use light-colored text (e.g., `#ffffff` or `#e0e0e0`).
2. Use semantic HTML and apply consistent padding, spacing, and border-radius for a clean layout.
3. Add CSS transitions for interactive elements (buttons, keypads, input fields).
4. Highlight active/focused elements with a soft accent color (e.g., `#00bfa5` or `#ff9800`).
5. Ensure good contrast ratios for accessibility and readability in dark environments.
6. Apply `prefers-color-scheme: dark` media query for auto-adaptation to device theme settings (optional).

---

## Backend Implementation (Serverless API, Vercel-Compatible)

### Iteration 1.1: Serverless API Setup
1. Create a `backend/api/estimate.js` file:
   ```
   backend/
   ├── api/
   │   └── estimate.js
   └── package.json
   ```
2. Use `formidable` or `busboy` for image parsing compatible with Vercel functions.

### Iteration 1.2: Secure Environment Variables
1. Set your API key in Vercel: `Settings > Environment Variables > ANTHROPIC_API_KEY`.
2. Access it in code using `process.env.ANTHROPIC_API_KEY`.

### Iteration 1.3: Validate & Process Request
1. Extract image and password from the request.
2. If password is wrong:
   - Return `401 Unauthorized` with a message.
3. If correct:
   - Read `mode` from the request (`basic` or `detailed`).
   - Upload image to a temporary hosting location and pass its URL.
   - Format prompt accordingly:
     - Basic: "Analyze this photo of a meal. Return the estimated macros (calories, protein, carbs, fat)."
     - Detailed: "Analyze this photo of a meal. Return the estimated macros (calories, protein, carbs, fat), and list the main ingredients visible in the image."
   - Send a message to Anthropic's Claude 3 API using the image URL.
   - Return structured JSON with fields like:
     ```json
     {
       "calories": 540,
       "protein": "30g",
       "carbs": "45g",
       "fat": "22g",
       "ingredients": ["grilled chicken", "rice", "broccoli"]
     }
     ```

### Iteration 1.4: Deployment
1. Push backend to Vercel via GitHub or CLI.
2. Test with frontend fetch call to `/api/estimate`.
3. Enforce HTTPS by default via Vercel.

---

