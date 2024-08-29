// src/pages/Home.jsx
import React from 'react';
import UserGreeting from '../components/UserGreeting';
import TimeWeather from '../components/TimeWeather';
import ProjectList from '../components/ProjectList';

const Home = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <UserGreeting />
        <TimeWeather />
      </div>
      <div>
        <ProjectList />
      </div>
    </div>
  );
};

export default Home;