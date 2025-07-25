import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBBKoDlolv0ZyLY_PIVCcABceLlEtLpqYc",
    authDomain: "last-used-ef3a4.firebaseapp.com",
    projectId: "last-used-ef3a4",
    storageBucket: "last-used-ef3a4.firebasestorage.app",
    messagingSenderId: "1084667910764",
    appId: "1:1084667910764:web:b5764c04a23e99d290d649",
    measurementId: "G-KFQKH8RLEJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };