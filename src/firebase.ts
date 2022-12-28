// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0YA-4E1C0HaKu7zAR3apREMp8xztRNWA",
  authDomain: "battleship-7f327.firebaseapp.com",
  projectId: "battleship-7f327",
  storageBucket: "battleship-7f327.appspot.com",
  messagingSenderId: "704481721334",
  appId: "1:704481721334:web:805943bf8576e7ffbe65d7",
  databaseURL: "https://battleship-7f327-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);