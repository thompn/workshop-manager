import React from 'react';
import UserGreeting from '../components/UserGreeting';
import TimeWeather from '../components/TimeWeather';
import RecentActivityList from '../components/RecentActivityList';
import QuickStats from '../components/QuickStats';
import QuickActions from '../components/QuickActions';

const Home = () => {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <UserGreeting />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <TimeWeather />
        </div>
      </div>

      <QuickStats />

      <QuickActions />
      
      <div>
        <RecentActivityList />
      </div>
    </div>
  );
};

export default Home;