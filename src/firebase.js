// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
// IMPORTANT: We're explicitly specifying the actual bucket here:
const storage = getStorage(app, "gs://brewery-events.firebasestorage.app");

/**
 * Uploads a file to Firebase Storage under a path based on the event ID.
 * Returns an object with the file's name, download URL, and storage path.
 * 
 * @param {File} file - The file to be uploaded.
 * @param {string} eventId - The ID of the event this file is associated with.
 * @returns {Promise<{name: string, url: string, path: string}>}
 */
async function uploadFile(file, eventId) {
  // Build a path: "events/{eventId}/{file.name}"
  const filePath = `events/${eventId}/${file.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, url, path: filePath };
}

/**
 * Deletes a file from Firebase Storage using its storage path.
 * 
 * @param {string} filePath - The storage path of the file to delete.
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
}

export { db, uploadFile, deleteFile };
