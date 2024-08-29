// src/components/UserGreeting.jsx
import React from 'react';

const UserGreeting = () => {
  // TODO: Replace with actual user data from backend
  const user = { name: 'John' };

  return (
    <h1 className="text-4xl font-bold mb-4">Hello {user.name}!</h1>
  );
};

export default UserGreeting;