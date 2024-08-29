import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addNewServiceRecord, getAllServiceTasks, getVehicle } from '../firebaseOperations';

const AddServiceRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serviceRecord, setServiceRecord] = useState({
    vehicle_id: id,
    service_date: '',
    service_type: '',
    mileage: '',
    technician: '',
    description: '',
    cost: '',
    parts_used: [],
    completed_tasks: [],
    notes: ''
  });

  const [partInput, setPartInput] = useState('');
  const [taskInput, setTaskInput] = useState('');

  const fetchVehicleAndServiceTasks = async () => {
    try {
      const vehicleData = await getVehicle(id);
      setVehicle(vehicleData);

      const serviceTasksData = await getAllServiceTasks();
      setServiceTasks(serviceTasksData);
    } catch (err) {
      console.error("Error fetching vehicle and service tasks:", err);
      setError("Failed to fetch vehicle details and service tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleAndServiceTasks();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceRecord({ ...serviceRecord, [name]: value });
  };

  const handleTaskToggle = (taskId) => {
    const updatedTasks = serviceRecord.completed_tasks.includes(taskId)
      ? serviceRecord.completed_tasks.filter(id => id !== taskId)
      : [...serviceRecord.completed_tasks, taskId];
    setServiceRecord({ ...serviceRecord, completed_tasks: updatedTasks });
  };

  const handleAddPart = () => {
    if (partInput.trim()) {
      setServiceRecord(prev => ({
        ...prev,
        parts_used: [...prev.parts_used, partInput.trim()]
      }));
      setPartInput('');
    }
  };

  const handleRemovePart = (index) => {
    setServiceRecord(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setServiceRecord(prev => ({
        ...prev,
        completed_tasks: [...prev.completed_tasks, taskInput.trim()]
      }));
      setTaskInput('');
    }
  };

  const handleRemoveTask = (index) => {
    setServiceRecord(prev => ({
      ...prev,
      completed_tasks: prev.completed_tasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newRecordId = await addNewServiceRecord(serviceRecord);
      console.log("New service record added with ID:", newRecordId);
      navigate(`/vehicles/${id}`);
    } catch (err) {
      console.error("Error adding service record:", err);
      setError(`Failed to add service record. Error: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add Service Record for {vehicle.make} {vehicle.model}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-gray-800 dark:text-white">
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="service_date">
            Service Date
          </label>
          <input
            type="date"
            id="service_date"
            name="service_date"
            value={serviceRecord.service_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="service_type">
            Service Type
          </label>
          <input
            type="text"
            id="service_type"
            name="service_type"
            value={serviceRecord.service_type}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="mileage">
            Mileage
          </label>
          <input
            type="number"
            id="mileage"
            name="mileage"
            value={serviceRecord.mileage}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="technician">
            Technician
          </label>
          <input
            type="text"
            id="technician"
            name="technician"
            value={serviceRecord.technician}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={serviceRecord.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            rows="3"
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="cost">
            Cost
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            value={serviceRecord.cost}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="parts_used">
            Parts Used
          </label>
          <div className="flex">
            <input
              type="text"
              id="parts_used"
              value={partInput}
              onChange={(e) => setPartInput(e.target.value)}
              className="flex-grow p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white mr-2"
            />
            <button
              type="button"
              onClick={handleAddPart}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Part
            </button>
          </div>
          <ul className="mt-2">
            {serviceRecord.parts_used.map((part, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded mb-1">
                <span>{part}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePart(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="completed_tasks">
            Completed Tasks
          </label>
          <div className="flex">
            <input
              type="text"
              id="completed_tasks"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className="flex-grow p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white mr-2"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Task
            </button>
          </div>
          <ul className="mt-2">
            {serviceRecord.completed_tasks.map((task, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded mb-1">
                <span>{task}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={serviceRecord.notes}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            rows="3"
          ></textarea>
        </div>

        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Service Record
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vehicles/${id}`)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddServiceRecord;