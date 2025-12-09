// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCquC_ZsPf59yGnlFLzK8Du1mgibvKOK_M",
  authDomain: "biddingapp-a6d8e.firebaseapp.com",
  projectId: "biddingapp-a6d8e",
  storageBucket: "biddingapp-a6d8e.firebasestorage.app",
  messagingSenderId: "870014358891",
  appId: "1:870014358891:web:b74cf577dfd38eff46e82e",
  measurementId: "G-0QWG9DQCLG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
