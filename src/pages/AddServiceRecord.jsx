import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addNewServiceRecord, getAllServiceTasks, getVehicle, getAllParts, getVehicleChecklist } from '../firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Select from 'react-select';
import VehicleServiceChecklist from '../components/VehicleServiceChecklist';

const AddServiceRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [serviceRecord, setServiceRecord] = useState({
    vehicle_id: id,
    service_date: '',
    service_type: '',
    mileage: '',
    technician: '',
    cost: '',
    parts_used: [],
    completed_tasks: [],
    notes: ''
  });

  const [serviceTypes, setServiceTypes] = useState([]);
  const [vehicleChecklist, setVehicleChecklist] = useState([]);

  const fetchVehicleChecklist = async (vehicleId, serviceType) => {
    try {
      const docRef = doc(db, 'vehicleChecklists', `${vehicleId}_${serviceType}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVehicleChecklist(docSnap.data().tasks || []);
      } else {
        console.log("No checklist found for this vehicle and service type");
        setVehicleChecklist([]);
      }
    } catch (error) {
      console.error("Error fetching vehicle checklist:", error);
      setVehicleChecklist([]);
    }
  };

  const fetchVehicleAndServiceTasks = async () => {
    try {
      const vehicleData = await getVehicle(id);
      setVehicle(vehicleData);
      if (vehicleData && vehicleData.serviceTypes) {
        setServiceTypes(vehicleData.serviceTypes);
      } else {
        console.log("No service types found for this vehicle");
        setServiceTypes([]);
      }

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
    fetchParts();
  }, [id]);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData.map(part => ({
        value: part.id,
        label: `${part.part_number_oem} - ${part.description}`,
        ...part
      })));
    } catch (err) {
      console.error("Error fetching parts:", err);
      setError("Failed to fetch parts. Please try again later.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceRecord({ ...serviceRecord, [name]: value });
  };

  const handleAddPart = () => {
    if (selectedPart) {
      setServiceRecord(prev => ({
        ...prev,
        parts_used: [...prev.parts_used, {
          id: selectedPart.value,
          part_number_oem: selectedPart.part_number_oem,
          description: selectedPart.description
        }]
      }));
      setSelectedPart(null);
    }
  };

  const handleRemovePart = (index) => {
    setServiceRecord(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
  };

  const handleServiceTypeChange = async (e) => {
    const serviceType = e.target.value;
    setServiceRecord(prev => ({ ...prev, service_type: serviceType, completed_tasks: [] }));

    if (serviceType) {
      const checklist = await getVehicleChecklist(id, serviceType);
      setVehicleChecklist(checklist);
    } else {
      setVehicleChecklist([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newServiceRecordId = await addNewServiceRecord({
        ...serviceRecord,
        vehicle_id: id,
        service_date: new Date(serviceRecord.service_date).toISOString(),
        parts_used: serviceRecord.parts_used.map(part => part.id)
      });
      console.log("New service record added with ID: ", newServiceRecordId);
      navigate(`/vehicles/${id}`);
    } catch (error) {
      console.error("Error adding new service record: ", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Add Service Record for {vehicle.make} {vehicle.model}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="service_date">
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
          <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Service Type
          </label>
          <select
            id="service_type"
            name="service_type"
            value={serviceRecord.service_type}
            onChange={handleServiceTypeChange}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a service type</option>
            {serviceTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {serviceRecord.service_type && (
          <VehicleServiceChecklist
            vehicleId={id}
            serviceType={serviceRecord.service_type}
            checklist={vehicleChecklist}
            onTasksSelected={(tasks) => setServiceRecord(prev => ({ ...prev, completed_tasks: tasks }))}
          />
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="mileage">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="technician">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="cost">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parts Used
          </label>
          <Select
            options={parts}
            value={selectedPart}
            onChange={setSelectedPart}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          <button
            type="button"
            onClick={handleAddPart}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Part
          </button>
          <ul className="mt-2">
            {serviceRecord.parts_used.map((part, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded mb-1">
                <span className="text-gray-800 dark:text-white">{`${part.part_number_oem} - ${part.description}`}</span>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="notes">
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
            type="button"
            onClick={() => navigate(`/vehicles/${id}`)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Service Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddServiceRecord;