import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getRecentTasks } from '../firebaseOperations'; // Updated import
import { FaTasks, FaCar, FaInfoCircle } from 'react-icons/fa';

const RecentActivityList = () => {
  const { data: recentTasks, isLoading, error } = useQuery(
    'recentTasks', 
    () => getRecentTasks(5), // Fetch 5 recent tasks
    {
      staleTime: 60000, // Cache for 1 minute
    }
  );

  if (isLoading) {
    return <div className="text-gray-700 dark:text-gray-300">Loading recent activity...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading recent activity: {error.message}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <FaTasks className="mr-3 text-indigo-500" /> Current To-Do / Vehicle Activity
      </h2>
      {(!recentTasks || recentTasks.length === 0) ? (
        <p className="text-gray-600 dark:text-gray-400">No recent activity found.</p>
      ) : (
        <div className="space-y-4">
          {recentTasks.map((task) => (
            <Link 
              to={`/vehicles/${task.vehicleId}`} 
              key={task.id} 
              className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
            >
              <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400">{task.name}</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <div className="flex items-center">
                  <FaCar className="mr-2 text-gray-500 dark:text-gray-400" />
                  <span>Vehicle: {task.vehicleMake} {task.vehicleModel} ({task.vehicleYear}) - {task.vehicleLicensePlate || 'N/A'}</span>
                </div>
                <p className="mt-1">Status: <span className={`font-semibold ${task.status === 'Done' ? 'text-green-500' : task.status === 'In Progress' ? 'text-yellow-500' : 'text-blue-500'}`}>{task.status}</span></p>
                {task.dateAdded?.toDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Added: {new Date(task.dateAdded.toDate()).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivityList; 