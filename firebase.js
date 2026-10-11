import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4bLWtYzU1jfYXo-V65DUzbY4zmlPzM9Q",
  authDomain: "dailyquest-3d9a8.firebaseapp.com",
  projectId: "dailyquest-3d9a8",
  storageBucket: "dailyquest-3d9a8.firebasestorage.app",
  messagingSenderId: "118054015129",
  appId: "1:118054015129:web:7d504469185c30ce06a808"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);