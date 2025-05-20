# My Macros App - Frontend

A mobile-first React application that estimates the macronutrients of food from images using the Claude 3 API via a secure backend.

## Overview

My Macros App allows users to upload food images and receive macronutrient estimates (calories, protein, carbs, and fat) along with identified ingredients. The app features a secure PIN-based authentication system and a responsive design optimized for mobile devices.

## Features

- **Secure Authentication**: 4-digit PIN protection (2911)
- **Image Upload Options**: Choose between camera or gallery
- **Food Analysis**: Detailed macronutrient breakdown
- **Ingredient Identification**: List of detected food items
- **Mobile-First Design**: Optimized for various screen sizes
- **Dark Theme**: Visually appealing dark UI with accent colors
- **Smooth Animations**: Enhanced user experience with transitions

## Tech Stack

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Custom CSS with animations
- **API Communication**: Fetch API
- **State Management**: React hooks (useState)

## Project Structure

```
src/
├── components/
│   ├── WelcomeScreen.jsx
│   ├── PasswordScreen.jsx
│   ├── ImageUploadScreen.jsx
│   └── ResultsScreen.jsx
├── App.jsx
├── App.css
└── index.jsx
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd my-macros-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## API Integration

The frontend communicates with a backend API deployed at `https://backend-mymacros.vercel.app` with the following endpoints:

### Authentication
```
POST /api/verify
```
Verifies the user's 4-digit PIN (2911).

### Image Analysis
```
POST /api/estimate
```
Analyzes food images to provide macronutrient estimates and identified ingredients.

## User Flow

1. **Welcome Screen**: App introduction with a "Get Started" button
2. **Password Screen**: 4-digit PIN entry (2911)
3. **Upload Screen**: Options to select an image from gallery or camera
4. **Results Screen**: Displays macronutrient analysis and ingredients
5. **Return to Home**: Option to analyze another image (requires re-authentication)

## Development Notes

### Authentication Flow

The app uses a simple PIN-based authentication:
- PIN is validated against the backend API
- No user accounts or sessions are stored
- Authentication is required before each analysis

### Image Handling

- Images are sent directly to the backend as FormData
- Users can choose between camera capture or gallery selection
- Image files are previewed locally before submission

### Error Handling

The app handles various error scenarios:
- Invalid PIN attempts
- Network connectivity issues
- Backend processing errors
- No food detected in images

### Design Principles

- **Dark Theme**: Background: #121212, Text: #ffffff/#e0e0e0, Accent: #00bfa5
- **Interactive Elements**: Animated transitions and hover states
- **Responsive**: Adapts to different screen sizes and orientations
- **Accessible**: Clear visual feedback and status indicators

## Deployment

The frontend is designed to be deployed on Vercel or similar platforms:

1. Connect your repository to Vercel
2. Set the framework preset to "Vite"
3. No environment variables are required for the frontend

## Troubleshooting

### Common Issues

- **Backend Connection Errors**: Ensure the backend API is accessible
- **Camera Access**: Check browser permissions for camera access
- **Image Upload Issues**: Verify file size limits (max 5MB)

### Browser Compatibility

The app is tested and optimized for:
- Chrome (Android and Desktop)
- Safari (iOS and macOS)
- Firefox (Desktop)

## Future Enhancements

Potential improvements for future versions:
- User accounts and saved meal history
- Detailed nutritional information
- Weekly/monthly tracking
- Barcode scanning for packaged foods
- Dark/light theme toggle

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support regarding the frontend implementation, please contact the development team.