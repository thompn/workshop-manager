import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getAllVehicles, getAllParts, getAllTasksAcrossVehicles, getAllPartsToOrder } from '../firebaseOperations';
import { FaCar, FaBoxOpen, FaTasks, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';

const StatCard = ({ title, value, icon, linkTo, bgColorClass = 'bg-blue-500', warning }) => (
  <Link to={linkTo} className={`block p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out ${bgColorClass} text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`text-4xl opacity-80 ${warning ? 'text-yellow-300' : ''}`}>
        {warning ? <FaExclamationTriangle /> : icon}
      </div>
    </div>
  </Link>
);

const QuickStats = () => {
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery('allVehicles', getAllVehicles);
  const { data: partsData, isLoading: isLoadingParts } = useQuery('allParts', getAllParts);
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery('allTasksAcrossVehicles', getAllTasksAcrossVehicles);
  const { data: partsToOrderData, isLoading: isLoadingPartsToOrder } = useQuery('partsToOrder', getAllPartsToOrder);

  const totalVehicles = vehiclesData?.length || 0;
  
  const partsBelowReorder = partsData?.filter(part => part.stock_level <= part.reorder_threshold).length || 0;
  
  const activeTasks = tasksData?.filter(task => task.status === 'To Do' || task.status === 'In Progress').length || 0;
  
  const totalPartsToOrder = partsToOrderData?.length || 0;

  if (isLoadingVehicles || isLoadingParts || isLoadingTasks || isLoadingPartsToOrder) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">At a Glance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vehicles" 
          value={totalVehicles} 
          icon={<FaCar />} 
          linkTo="/vehicles"
          bgColorClass="bg-gradient-to-br from-sky-500 to-sky-600"
        />
        <StatCard 
          title="Parts Needing Reorder" 
          value={partsBelowReorder} 
          icon={<FaBoxOpen />} 
          linkTo="/parts" // Link to parts page, user can filter/see low stock
          bgColorClass="bg-gradient-to-br from-amber-500 to-amber-600"
          warning={partsBelowReorder > 0}
        />
        <StatCard 
          title="Active Tasks" 
          value={activeTasks} 
          icon={<FaTasks />} 
          linkTo="/todo"
          bgColorClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <StatCard 
          title="Items to Order" 
          value={totalPartsToOrder} 
          icon={<FaClipboardList />} 
          linkTo="/parts#partsToOrder" // Placeholder, actual tab linking needs more work
          bgColorClass="bg-gradient-to-br from-rose-500 to-rose-600"
        />
      </div>
    </div>
  );
};

export default QuickStats; 