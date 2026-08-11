# React Native Mobile App

This folder contains a separate React Native app that connects to your backend.

## Setup
1. Install Expo dependencies:
   - npm install
2. Start the app:
   - npm start
3. Run on Android/iOS emulator or physical device.

## Backend
- The mobile backend is in the sibling folder: mobile-backend
- Start it with:
  - cd mobile-backend
  - npm install
  - node server.js

## Notes
- The app uses the backend endpoint http://10.0.2.2:8080/api for Android emulators.
- For a physical device, replace 10.0.2.2 with your computer's local IP address.
