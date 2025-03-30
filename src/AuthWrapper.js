// src/AuthWrapper.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthForm from './AuthForm';

const AuthWrapper = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Optionally, show a loading indicator.
    return <div>Loading...</div>;
  }

  // If no user is signed in, display the AuthForm.
  if (!user) {
    return <AuthForm />;
  }

  // If a user is signed in, render the children (your main app content).
  return <>{children}</>;
};

export default AuthWrapper;
