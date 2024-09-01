import React, { useState, useEffect } from 'react';
import { getVehicleChecklist } from '../firebaseOperations';

const VehicleServiceChecklist = ({ vehicleId, serviceType, onTasksSelected }) => {
  const [checklist, setChecklist] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (vehicleId && serviceType) {
        const fetchedChecklist = await getVehicleChecklist(vehicleId, serviceType);
        setChecklist(fetchedChecklist);
      }
    };
    fetchChecklist();
  }, [vehicleId, serviceType]);

  const handleTaskToggle = (task) => {
    const updatedSelectedTasks = selectedTasks.includes(task)
      ? selectedTasks.filter(t => t !== task)
      : [...selectedTasks, task];
    setSelectedTasks(updatedSelectedTasks);
    onTasksSelected(updatedSelectedTasks);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Service Checklist</h3>
      <ul>
        {checklist.map((task, index) => (
          <li key={index} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`task-${index}`}
              checked={selectedTasks.includes(task)}
              onChange={() => handleTaskToggle(task)}
              className="mr-2"
            />
            <label htmlFor={`task-${index}`} className="text-gray-800 dark:text-white">
              {task}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VehicleServiceChecklist;