// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbZOH0HFhD5DH_xxYB9XNt9asbid9gjAc",
  authDomain: "brewery-events.firebaseapp.com",
  projectId: "brewery-events",
  storageBucket: "brewery-events.appspot.com",
  messagingSenderId: "246422922629",
  appId: "1:246422922629:web:2fc0cb8e4881fd0fd4d0ec",
  measurementId: "G-3VJCMZKBVT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
