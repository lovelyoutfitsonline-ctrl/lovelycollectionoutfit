# Lovely Collection - Fashion eCommerce Platform

This is a premium full-stack fashion eCommerce platform featuring a mobile-first React frontend, a Node.js/Express backend with Socket.IO, and a Flutter seller application.

## Project Structure

- `/frontend` - React.js Web Application (Customer)
- `/backend` - Node.js + Express API + Socket.IO Server
- `/seller-app` - Flutter Seller Dashboard Mobile App

## Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB Atlas, JWT, Socket.IO
- **Mobile:** Flutter

## Environment Variables

### Backend (`/backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/lovelycollection
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`/frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Setup & Run Locally

### 1. Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Seller App
```bash
cd seller-app
flutter pub get
flutter run
```

## Deployment Configuration

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import project in Vercel.
3. Set Framework Preset to **Vite**.
4. Build Command: `npm run build`, Output Directory: `dist`.
5. Add `VITE_API_URL` to Environment Variables.
6. Deploy.

### Backend (Render/Railway)
1. Create a new Web Service on Render or Railway.
2. Connect your GitHub repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all `.env` variables (MONGO_URI, JWT_SECRET, etc.).
6. Deploy.

### Seller App (Android APK)
1. Run `flutter build apk --release` in the `/seller-app` directory.
2. The APK will be generated at `build/app/outputs/flutter-apk/app-release.apk`.
3. Distribute the APK to your sellers.

## UI/UX Design

The application implements a premium glassmorphism design with a **Sky Blue, White, and Soft Cyan** theme. The mobile-first layout ensures that the web application feels identical to a native mobile application, complete with a floating bottom navigation bar and dynamic glass card components.
