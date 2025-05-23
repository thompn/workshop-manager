import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllVehicles, addTask } from '../firebaseOperations'; // Assuming you have these
import { useNotification } from '../contexts/NotificationContext';
import { serverTimestamp } from 'firebase/firestore';

const CreateTaskFromPartsModal = ({ isOpen, onClose, selectedPartIds, partsData }) => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const { data: vehicles, isLoading: isLoadingVehicles, error: errorVehicles } = useQuery(
    'allVehiclesForTaskModal',
    getAllVehicles,
    {
      enabled: isOpen,
      staleTime: 300000, 
    }
  );

  useEffect(() => {
    if (isOpen && selectedPartIds && selectedPartIds.size > 0 && partsData) {
      const selectedPartsDetails = Array.from(selectedPartIds)
        .map(id => partsData.find(p => p.id === id))
        .filter(p => p);
      
      if (selectedPartsDetails.length > 0) {
        const firstSelectedPart = selectedPartsDetails[0];
        const partNames = selectedPartsDetails.map(p => p.part_number_oem || p.part_number_vendor || p.description).join(', ');
        setTaskName(`Task involving: ${partNames}`);
        setTaskDescription(`New task created from parts: ${partNames}. Quantities: ${selectedPartsDetails.map(p => `${p.part_number_oem || p.part_number_vendor || p.description} (Qty: ${p.quantity || 1})`).join(', ')}`);
        
        // Auto-select vehicle if the first part has one
        if (firstSelectedPart && firstSelectedPart.vehicle_id && vehicles) {
          const vehicleExists = vehicles.some(v => v.id === firstSelectedPart.vehicle_id);
          if (vehicleExists) {
            setSelectedVehicleId(firstSelectedPart.vehicle_id);
          }
        } else if (!selectedVehicleId) { // Only clear if not already set by part and no previous selection persisted
            setSelectedVehicleId(''); // Default to no vehicle selected if first part has no vehicle_id
        }
      } else {
        setTaskName('');
        setTaskDescription('');
        setSelectedVehicleId(''); // Clear vehicle if no parts selected
      }
    } else if (isOpen) {
        // Clear fields if modal is open but no parts selected
        setTaskName('');
        setTaskDescription('');
        setSelectedVehicleId(''); // Clear vehicle if modal opened without parts
    }
  }, [isOpen, selectedPartIds, partsData, vehicles]); // Added vehicles to dependency array

  const createTaskMutation = useMutation(
    (mutationData) => addTask(mutationData.vehicleId, mutationData.taskData),
    {
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['vehicleTasks', variables.vehicleId]); 
      queryClient.invalidateQueries('allTasks'); 
      showNotification('Task created successfully and linked to vehicle!', 'success');
      onClose();
      setSelectedVehicleId('');
      setTaskName('');
      setTaskDescription('');
    },
    onError: (error) => {
      showNotification(`Error creating task: ${error.message}`, 'error');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      showNotification('Please select a vehicle.', 'error');
      return;
    }
    if (!taskName.trim()) {
      showNotification('Please enter a task name.', 'error');
      return;
    }

    const linkedPartsData = Array.from(selectedPartIds)
      .map(id => {
        const part = partsData.find(p => p.id === id);
        return part ? { 
          partId: part.id, 
          partNumber: part.part_number_oem || part.part_number_vendor || null,
          description: part.description || null,
          quantityRequired: part.quantity || 1,
          status: 'Pending' 
        } : null;
      })
      .filter(p => p);

    const newTask = {
      name: taskName,
      description: taskDescription,
      status: 'To Do', 
      linkedParts: linkedPartsData,
      dateAdded: serverTimestamp(),
    };
    
    createTaskMutation.mutate({ vehicleId: selectedVehicleId, taskData: newTask });
  };

  if (!isOpen) return null;

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Task for Vehicle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vehicleSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Vehicle *
            </label>
            {isLoadingVehicles && <p className="text-sm text-gray-500 dark:text-gray-400">Loading vehicles...</p>}
            {errorVehicles && <p className="text-sm text-red-500">Error loading vehicles: {errorVehicles.message}</p>}
            <select
              id="vehicleSelect"
              name="vehicleSelect"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className={`${inputClass} ${isLoadingVehicles || errorVehicles ? 'opacity-50 cursor-not-allowed' : ''}`}
              required
              disabled={isLoadingVehicles || errorVehicles}
            >
              <option value="">-- Select a Vehicle --</option>
              {vehicles?.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate || vehicle.vin}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vehicle not listed? Add it via the 'Manage Vehicles' page.</p>
          </div>

          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Name *
            </label>
            <input
              type="text"
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className={inputClass}
              required
              placeholder="e.g., Replace front brake pads"
            />
          </div>

          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Description (Optional)
            </label>
            <textarea
              id="taskDescription"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows="3"
              className={inputClass}
              placeholder="Additional details: check rotor thickness, bleed brakes..."
            />
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>Selected Parts ({selectedPartIds ? selectedPartIds.size : 0}):</p>
            <ul className="list-disc list-inside ml-4 max-h-24 overflow-y-auto">
              {partsData && selectedPartIds && Array.from(selectedPartIds).map(id => {
                const part = partsData.find(p => p.id === id);
                return part ? <li key={id}>{part.partNumber || part.description} (Qty: {part.quantity || 1})</li> : null;
              })}
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={createTaskMutation.isLoading || isLoadingVehicles}
            >
              {createTaskMutation.isLoading ? 'Creating Task...' : 'Create Task for Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskFromPartsModal; 