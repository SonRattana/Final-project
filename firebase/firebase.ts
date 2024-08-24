// firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBe2Nv8eG6La7d0BqO_2QWb2-hc6GMk93M",
  authDomain: "ladizo-af6f5.firebaseapp.com",
  projectId: "ladizo-af6f5",
  storageBucket: "ladizo-af6f5.appspot.com",
  messagingSenderId: "357402923317",
  appId: "1:357402923317:web:de5f6adb5c37b2fc43fc7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export messaging if needed
export const messaging = getMessaging(app);

// Export default the app
export default app;  // Đây là dòng quan trọng để bạn có thể import mặc định
