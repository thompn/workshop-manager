// src/components/UserGreeting.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserGreeting = () => {
  const { currentUser } = useAuth();

  return (
    <h1 className="text-4xl font-bold mb-4">Hello {currentUser?.displayName || 'User'}!</h1>
  );
};

export default UserGreeting;