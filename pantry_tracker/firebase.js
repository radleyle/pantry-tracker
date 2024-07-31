// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDO35BOtV3vi-qMeBAJUJ4TAAqROU-KIA4",
  authDomain: "pantry-tracker-1fe3c.firebaseapp.com",
  projectId: "pantry-tracker-1fe3c",
  storageBucket: "pantry-tracker-1fe3c.appspot.com",
  messagingSenderId: "998929683888",
  appId: "1:998929683888:web:5c28b1bc231306af353275",
  measurementId: "G-SP1DRVR4R5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export {firestore}