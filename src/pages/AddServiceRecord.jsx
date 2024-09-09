import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addNewServiceRecord, getAllServiceTasks, getVehicle, getAllParts, getVehicleChecklist, updatePartCount } from '../firebaseOperations';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import VehicleServiceChecklist from '../components/VehicleServiceChecklist';
import Select from 'react-select';
import { useParts } from '../context/PartsContext';
import { useAuth } from '../context/AuthContext';

const AddServiceRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const { user } = useAuth();
  const [serviceRecord, setServiceRecord] = useState({
    vehicle_id: id,
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
    mileage: '',
    technician: user ? user.displayName || user.email : '',
    cost: '',
    parts_used: [],
    completed_tasks: [],
    notes: ''
  });

  const [serviceTypes, setServiceTypes] = useState([]);
  const [vehicleChecklist, setVehicleChecklist] = useState([]);
  const { setUpdateParts } = useParts();

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

  const restorePartsToInventory = useCallback(() => {
    setParts(prevParts => {
      const updatedParts = [...prevParts];
      for (const part of serviceRecord.parts_used) {
        const existingPartIndex = updatedParts.findIndex(p => p.value === part.id);
        if (existingPartIndex !== -1) {
          updatedParts[existingPartIndex] = {
            ...updatedParts[existingPartIndex],
            stock_level: updatedParts[existingPartIndex].stock_level + part.quantity
          };
        } else {
          updatedParts.push({
            value: part.id,
            label: `${part.part_number_oem} - ${part.description}`,
            ...part,
            stock_level: part.quantity
          });
        }
      }
      return updatedParts;
    });
  }, [serviceRecord.parts_used]);

  useEffect(() => {
    fetchVehicleAndServiceTasks();
    fetchParts();

    return () => {
      // Cleanup function to restore parts if component unmounts without submitting
      restorePartsToInventory();
    };
  }, [id, restorePartsToInventory]);

  useEffect(() => {
    if (user) {
      setServiceRecord(prev => ({
        ...prev,
        technician: user.displayName || user.email
      }));
    }
  }, [user]);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData
        .filter(part => part.stock_level > 0)
        .map(part => ({
          value: part.id,
          label: `${part.part_number_oem} - ${part.description}`,
          ...part
        }))
      );
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
    if (selectedPart && selectedPart.stock_level > 0) {
      const existingPartIndex = serviceRecord.parts_used.findIndex(part => part.id === selectedPart.value);
      let updatedPartsUsed;
      if (existingPartIndex !== -1) {
        const currentQuantity = serviceRecord.parts_used[existingPartIndex].quantity;
        if (currentQuantity < selectedPart.stock_level) {
          updatedPartsUsed = serviceRecord.parts_used.map((part, index) => 
            index === existingPartIndex ? { ...part, quantity: part.quantity + 1 } : part
          );
        } else {
          alert("Cannot add more of this part. Stock limit reached.");
          return;
        }
      } else {
        updatedPartsUsed = [
          ...serviceRecord.parts_used,
          {
            id: selectedPart.value,
            part_number_oem: selectedPart.part_number_oem,
            description: selectedPart.description,
            cost: selectedPart.cost || 0,
            quantity: 1,
            initial_stock_level: selectedPart.stock_level
          }
        ];
      }
      const totalCost = calculateTotalCost(updatedPartsUsed);
      setServiceRecord(prev => ({
        ...prev,
        parts_used: updatedPartsUsed,
        cost: totalCost.toFixed(2)
      }));

      // Update the parts list
      setParts(prevParts => prevParts.map(part => 
        part.value === selectedPart.value 
          ? { ...part, stock_level: part.stock_level - 1 }
          : part
      ));

      setSelectedPart(null);
    }
  };

  const handleRemovePart = (index) => {
    const removedPart = serviceRecord.parts_used[index];
    const updatedPartsUsed = serviceRecord.parts_used.filter((_, i) => i !== index);
    const totalCost = calculateTotalCost(updatedPartsUsed);
    setServiceRecord(prev => ({
      ...prev,
      parts_used: updatedPartsUsed,
      cost: totalCost.toFixed(2)
    }));

    // Update the parts list
    setParts(prevParts => prevParts.map(part => 
      part.value === removedPart.id 
        ? { ...part, stock_level: part.stock_level + removedPart.quantity }
        : part
    ));
  };

  const handleIncrementPart = (index) => {
    const part = serviceRecord.parts_used[index];
    const availableStock = parts.find(p => p.value === part.id)?.stock_level || 0;

    if (part.quantity < availableStock) {
      const updatedPartsUsed = serviceRecord.parts_used.map((p, i) => 
        i === index ? { ...p, quantity: p.quantity + 1 } : p
      );
      const totalCost = calculateTotalCost(updatedPartsUsed);
      setServiceRecord(prev => ({
        ...prev,
        parts_used: updatedPartsUsed,
        cost: totalCost.toFixed(2)
      }));

      // Update the parts list
      setParts(prevParts => prevParts.map(p => 
        p.value === part.id 
          ? { ...p, stock_level: p.stock_level - 1 }
          : p
      ));
    } else {
      alert("Cannot add more of this part. Stock limit reached.");
    }
  };

  const calculateTotalCost = (parts) => {
    return parts.reduce((total, part) => total + (part.cost || 0) * (part.quantity || 1), 0);
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

  const handleCancel = () => {
    restorePartsToInventory();
    setServiceRecord(prev => ({ ...prev, parts_used: [] }));
    navigate(`/vehicles/${id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newServiceRecordId = await addNewServiceRecord({
        ...serviceRecord,
        vehicle_id: id,
        service_date: new Date(serviceRecord.service_date).toISOString(),
        parts_used: serviceRecord.parts_used.map(part => ({
          id: part.id,
          part_number_oem: part.part_number_oem,
          description: part.description,
          cost: part.cost,
          quantity: part.quantity
        }))
      });
      console.log("New service record added with ID: ", newServiceRecordId);

      // Update the actual database stock levels
      for (const part of serviceRecord.parts_used) {
        await updatePartCount(part.id, -part.quantity);
      }

      navigate(`/vehicles/${id}`);
    } catch (error) {
      console.error("Error adding new service record: ", error);
      // If there's an error, restore the parts to inventory locally
      restorePartsToInventory();
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
          >
            <option value="">Select a service type (optional)</option>
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
            onTasksSelected={(tasks) => setServiceRecord(prev => ({ 
              ...prev, 
              completed_tasks: tasks 
            }))}
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
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: 'white',
                borderColor: '#e2e8f0',
                '&:hover': {
                  borderColor: '#cbd5e0',
                },
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: 'white',
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected ? '#3b82f6' : 'white',
                color: state.isSelected ? 'white' : 'black',
                '&:hover': {
                  backgroundColor: '#bfdbfe',
                  color: 'black',
                },
              }),
            }}
          />
          <button
            type="button"
            onClick={handleAddPart}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Part
          </button>
          <ul className="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md divide-y divide-gray-200 dark:divide-gray-600">
            {serviceRecord.parts_used.map((part, index) => (
              <li key={index} className="flex items-center justify-between p-2">
                <span className="text-gray-800 dark:text-white">
                  {`${part.part_number_oem} - ${part.description} (Quantity: ${part.quantity})`}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mr-2"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIncrementPart(index)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    +
                  </button>
                </div>
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
            onClick={handleCancel}
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