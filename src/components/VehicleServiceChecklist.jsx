import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

const VehicleServiceChecklist = ({ vehicleId, serviceType, checklist, onTasksSelected }) => {
  const [selectedTasks, setSelectedTasks] = useState([]);

  const handleTaskToggle = useCallback((task) => {
    setSelectedTasks((prevTasks) => {
      if (prevTasks.includes(task)) {
        return prevTasks.filter(t => t !== task);
      } else {
        return [...prevTasks, task];
      }
    });
  }, []);

  useEffect(() => {
    onTasksSelected(selectedTasks);
  }, [selectedTasks, onTasksSelected]);

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Service Checklist</h3>
      <ul className="space-y-2">
        {checklist.map((task, index) => (
          <li key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <span className="text-gray-800 dark:text-white">{task}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleTaskToggle(task);
              }}
              className={`${
                selectedTasks.includes(task)
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white font-bold py-1 px-2 rounded`}
            >
              {selectedTasks.includes(task) ? <FaMinus /> : <FaPlus />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VehicleServiceChecklist;