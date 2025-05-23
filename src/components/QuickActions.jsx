import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaBoxes, FaClipboardList } from 'react-icons/fa';

const QuickActionButton = ({ to, text, icon, bgColorClass = 'bg-green-500', action }) => {
  const navigate = useNavigate();
  const commonClasses = "flex items-center justify-center w-full px-6 py-3 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity duration-150 ease-in-out text-sm";

  if (action) {
    return (
      <button 
        onClick={action}
        className={`${commonClasses} ${bgColorClass}`}
      >
        {icon && <span className="mr-2 text-lg">{icon}</span>}
        {text}
      </button>
    );
  }

  return (
    <Link 
      to={to}
      className={`${commonClasses} ${bgColorClass}`}
    >
      {icon && <span className="mr-2 text-lg">{icon}</span>}
      {text}
    </Link>
  );
};

const QuickActions = () => {
  const navigate = useNavigate();

  const handleGoToPartOrdering = () => {
    navigate('/parts', { state: { activeTab: 'partsToOrder' } });
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionButton 
          to="/vehicles/manage" 
          text="Add New Vehicle" 
          icon={<FaPlusCircle />} 
          bgColorClass="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <QuickActionButton 
          to="/parts" // Could refine to open 'add part' form later
          text="Add New Part" 
          icon={<FaBoxes />} 
          bgColorClass="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <QuickActionButton 
          action={handleGoToPartOrdering}
          text="Go to Part Ordering" 
          icon={<FaClipboardList />} 
          bgColorClass="bg-gradient-to-r from-teal-500 to-teal-600"
        />
      </div>
    </div>
  );
};

export default QuickActions; 