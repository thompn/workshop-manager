import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotification } from '../contexts/NotificationContext';

const ManageVehicleChecklists = () => {
  const { showNotification } = useNotification();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [serviceInterval, setServiceInterval] = useState('');
  const [newTask, setNewTask] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [isCreatingNewChecklist, setIsCreatingNewChecklist] = useState(false);
  const [newServiceType, setNewServiceType] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
    const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      serviceTypes: doc.data().serviceTypes || []
    }));
    setVehicles(vehiclesData);
  };

  const fetchChecklist = async (vehicleId, serviceType) => {
    const docRef = doc(db, 'vehicleChecklists', `${vehicleId}_${serviceType}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setChecklist(data.tasks || []);
      setServiceInterval(data.interval || '');
      setIsCreatingNewChecklist(false);
    } else {
      setChecklist([]);
      setServiceInterval('');
      setIsCreatingNewChecklist(true);
    }
  };

  const handleVehicleChange = (e) => {
    setSelectedVehicleId(e.target.value);
    setSelectedServiceType('');
    setChecklist([]);
    setServiceInterval('');
    setIsCreatingNewChecklist(false);
  };

  const handleServiceTypeChange = (e) => {
    const selectedType = e.target.value;
    setSelectedServiceType(selectedType);
    if (selectedVehicleId && selectedType) {
      fetchChecklist(selectedVehicleId, selectedType);
    } else {
      setChecklist([]);
      setServiceInterval('');
    }
  };

  const handleAddTask = async () => {
    if (newTask.trim() && selectedVehicleId && selectedServiceType) {
      try {
        const updatedChecklist = [...checklist, newTask.trim()];
        await updateChecklistInFirestore(updatedChecklist, serviceInterval);
        setChecklist(updatedChecklist);
        setNewTask('');
        showNotification("Task added to checklist.", "success");
      } catch (error) {
        console.error("Error adding task:", error);
        showNotification("Failed to add task.", "error");
      }
    }
  };

  const handleRemoveTask = async (index) => {
    if (selectedVehicleId && selectedServiceType) {
      try {
        const updatedChecklist = checklist.filter((_, i) => i !== index);
        await updateChecklistInFirestore(updatedChecklist, serviceInterval);
        setChecklist(updatedChecklist);
        showNotification("Task removed from checklist.", "success");
      } catch (error) {
        console.error("Error removing task:", error);
        showNotification("Failed to remove task.", "error");
      }
    }
  };

  const updateChecklistInFirestore = async (tasksToUpdate, intervalToUpdate) => {
    if (!selectedVehicleId || !selectedServiceType) {
      console.warn("Attempted to update checklist without selected vehicle/type");
      return;
    }
    await setDoc(doc(db, 'vehicleChecklists', `${selectedVehicleId}_${selectedServiceType}`), {
      tasks: tasksToUpdate,
      interval: intervalToUpdate
    });
  };

  const handleIntervalChange = async (e) => {
    const newInterval = e.target.value;
    setServiceInterval(newInterval);
    if (selectedVehicleId && selectedServiceType) {
      try {
        await updateChecklistInFirestore(checklist, newInterval);
        showNotification("Service interval updated.", "success");
      } catch (error) {
        console.error("Error updating service interval:", error);
        showNotification("Failed to update service interval.", "error");
      }
    }
  };

  const handleCreateNewChecklist = async () => {
    if (selectedVehicleId && selectedServiceType) {
      try {
        await updateChecklistInFirestore([], '');
        setChecklist([]);
        setServiceInterval('');
        setIsCreatingNewChecklist(false);
        showNotification("New empty checklist created.", "success");
      } catch (error) {
        console.error("Error creating new checklist:", error);
        showNotification("Failed to create new checklist.", "error");
      }
    }
  };

  const handleAddNewServiceType = async () => {
    if (selectedVehicleId && newServiceType.trim()) {
      const vehicleRef = doc(db, 'vehicles', selectedVehicleId);
      const vehicleDoc = await getDoc(vehicleRef);
      if (vehicleDoc.exists()) {
        const currentServiceTypes = vehicleDoc.data().serviceTypes || [];
        const trimmedNewServiceType = newServiceType.trim();
        if (!currentServiceTypes.includes(trimmedNewServiceType)) {
          try {
            await updateDoc(vehicleRef, {
              serviceTypes: [...currentServiceTypes, trimmedNewServiceType]
            });
            setVehicles(prevVehicles => 
              prevVehicles.map(v => 
                v.id === selectedVehicleId 
                  ? { ...v, serviceTypes: [...(v.serviceTypes || []), trimmedNewServiceType] } 
                  : v
              )
            );
            setSelectedServiceType(trimmedNewServiceType);
            setNewServiceType('');
            setChecklist([]);
            setServiceInterval('');
            setIsCreatingNewChecklist(true);
            showNotification(`Service type "${trimmedNewServiceType}" added. You can now create its checklist.`, "success");
          } catch (error) {
            console.error("Error adding new service type:", error);
            showNotification(`Failed to add service type: ${error.message}`, "error");
          }
        } else {
          showNotification(`Service type "${trimmedNewServiceType}" already exists for this vehicle.`, "error");
        }
      } else {
        showNotification("Vehicle not found. Cannot add service type.", "error");
      }
    }
  };

  const handleRemoveServiceType = async () => {
    if (!selectedVehicleId || !selectedServiceType) return;

    if (window.confirm(`Are you sure you want to remove the service type "${selectedServiceType}" from this vehicle? This will not delete existing checklists, but they may become hidden if no vehicle uses this service type.`)) {
      const vehicleRef = doc(db, 'vehicles', selectedVehicleId);
      const vehicleDoc = await getDoc(vehicleRef);

      if (vehicleDoc.exists()) {
        try {
          const currentServiceTypes = vehicleDoc.data().serviceTypes || [];
          const updatedServiceTypes = currentServiceTypes.filter(type => type !== selectedServiceType);
          await updateDoc(vehicleRef, {
            serviceTypes: updatedServiceTypes
          });
          setVehicles(prevVehicles =>
            prevVehicles.map(v =>
              v.id === selectedVehicleId
                ? { ...v, serviceTypes: updatedServiceTypes }
                : v
            )
          );
          showNotification(`Service type "${selectedServiceType}" removed.`, "success");
          setSelectedServiceType('');
          setChecklist([]);
          setServiceInterval('');
          setIsCreatingNewChecklist(false);
        } catch (error) {
          console.error("Error removing service type:", error);
          showNotification(`Failed to remove service type: ${error.message}`, "error");
        }
      } else {
        console.error("Vehicle not found for removing service type.");
        showNotification("Error: Vehicle not found.", "error");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manage Vehicle Checklists</h1>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedVehicleId}
          onChange={handleVehicleChange}
        >
          <option value="">Select a vehicle</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </option>
          ))}
        </select>

        {selectedVehicleId && (
          <>
            <select
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedServiceType}
              onChange={handleServiceTypeChange}
            >
              <option value="">Select service type</option>
              {vehicles.find(v => v.id === selectedVehicleId)?.serviceTypes?.map(type => (
                <option key={type} value={type}>{type}</option>
              )) || []}
            </select>
            {selectedServiceType && (
              <button
                onClick={handleRemoveServiceType}
                className="ml-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                title="Remove selected service type from this vehicle"
              >
                Remove Type
              </button>
            )}
            {!selectedServiceType && (
              <div className="flex">
                <input
                  type="text"
                  placeholder="New service type"
                  className="p-2 border rounded-l bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                />
                <button
                  onClick={handleAddNewServiceType}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-r transition duration-150 ease-in-out"
                >
                  Add
                </button>
              </div>
            )}
          </>
        )}

        {selectedServiceType && (
          <div className="flex items-center">
            <label className="mr-2 text-gray-700 dark:text-gray-300">Interval (km):</label>
            <input
              type="number"
              value={serviceInterval}
              onChange={handleIntervalChange}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {selectedServiceType && !isCreatingNewChecklist && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            Checklist for {selectedServiceType}
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-3 text-left text-gray-600 dark:text-gray-200 font-semibold">Task</th>
                <th className="p-3 text-left text-gray-600 dark:text-gray-200 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((task, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3 text-gray-800 dark:text-gray-200">{task}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleRemoveTask(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition duration-150 ease-in-out"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="New task"
              className="flex-grow p-2 border rounded-l bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button
              onClick={handleAddTask}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r transition duration-150 ease-in-out"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {selectedServiceType && isCreatingNewChecklist && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            Create New Checklist for {selectedServiceType}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            No checklist exists for this vehicle and service type. Click the button below to create a new one.
          </p>
          <button
            onClick={handleCreateNewChecklist}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            Create New Checklist
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageVehicleChecklists;