import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';
import { FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { format } from 'date-fns';
import { getServiceRecordsByVehicle } from '../firebaseOperations';
import { 
  getAllVehicleMakesFromNHTSA, 
  getModelsForMakeIdFromNHTSA, 
  getModelsForMakeIdYearFromNHTSA, 
  getVehicleDetailsByVin 
} from '../vehicleApi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const ManageVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const initialNewVehicleState = {
    vehicle_type_id: '',
    license_plate: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    current_mileage: '',
    color: '',
    vehicle_type: '',
    purchase_date: '',
    status: '',
    engine_type: '',
    fuel_type: '',
    transmission_type: '',
    seating_capacity: '',
    cargo_volume: '',
    insured: false,
    insurance_provider: '',
    insurance_policy_number: '',
    gps_tracking_enabled: false,
    nhtsaMakeId: '',
    nhtsaModelId: '',
    nhtsaMakeName: '',
    nhtsaModelName: '',
    vinDetails: {},
    vehicle_type_details: {
      type_id: '',
      vehicle_type: ''
    },
    latest_service: {
      service_id: '',
      service_date: '',
      service_type: '',
      service_mileage: '',
      cost: '',
      brake_pads_checked: false,
      oil_checked: false,
      air_filter_checked: false,
      chain_checked: false,
      fuel_lines_checked: false,
      bearings_checked: false,
      tires_checked: false,
      lights_checked: false,
      battery_checked: false,
      coolant_level_checked: false,
      transmission_fluid_checked: false,
      exhaust_system_checked: false
    },
    current_location: {
      location_id: '',
      location_reference: '',
      description: ''
    },
    serviceTypes: []
  };
  const [newVehicle, setNewVehicle] = useState(initialNewVehicleState);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const [nhtsaMakes, setNhtsaMakes] = useState([]);
  const [nhtsaModels, setNhtsaModels] = useState([]);
  const [selectedNHTSAMakeId, setSelectedNHTSAMakeId] = useState('');
  const [selectedNHTSAModelId, setSelectedNHTSAModelId] = useState('');
  const [isFetchingNHTSAMakes, setIsFetchingNHTSAMakes] = useState(false);
  const [isFetchingNHTSAModels, setIsFetchingNHTSAModels] = useState(false);
  const [isFetchingVINDetails, setIsFetchingVINDetails] = useState(false);

  const handleEditClick = (e, vehicle) => {
    e.stopPropagation();
    setEditingVehicle(prevState => prevState === vehicle.id ? null : vehicle.id);
    setExpandedVehicle(vehicle.id);
  };

  useEffect(() => {
    fetchVehicles();
    const fetchMakes = async () => {
      setIsFetchingNHTSAMakes(true);
      try {
        const makes = await getAllVehicleMakesFromNHTSA();
        setNhtsaMakes(makes);
      } catch (error) {
        console.error("Failed to fetch NHTSA makes:", error);
      }
      setIsFetchingNHTSAMakes(false);
    };
    fetchMakes();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedNHTSAMakeId) {
        setNhtsaModels([]);
        return;
      }
      setIsFetchingNHTSAModels(true);
      setNhtsaModels([]);
      try {
        let models;
        if (newVehicle.year && newVehicle.year.length === 4) {
          models = await getModelsForMakeIdYearFromNHTSA(selectedNHTSAMakeId, newVehicle.year);
        } else {
          models = await getModelsForMakeIdFromNHTSA(selectedNHTSAMakeId);
        }
        setNhtsaModels(models);
      } catch (error) {
        console.error("Failed to fetch NHTSA models:", error);
        setNhtsaModels([]);
      }
      setIsFetchingNHTSAModels(false);
    };

    if (selectedNHTSAMakeId) {
      fetchModels();
    } else {
      setNhtsaModels([]);
    }
  }, [selectedNHTSAMakeId, newVehicle.year]);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehicleList = await Promise.all(querySnapshot.docs.map(async doc => {
        const vehicleData = { id: doc.id, ...doc.data() };
        try {
          const serviceRecords = await getServiceRecordsByVehicle(doc.id);
          const latestService = serviceRecords.length > 0 
            ? serviceRecords.reduce((latest, current) => 
                new Date(current.service_date) > new Date(latest.service_date) ? current : latest
              ) 
            : null;
          return { ...vehicleData, latest_service: latestService };
        } catch (error) {
          console.error(`Error fetching service records for vehicle ${doc.id}:`, error);
          return vehicleData;
        }
      }));
      setVehicles(vehicleList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleInputChange = (e, vehicleId = null) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (vehicleId) {
      setVehicles(prevVehicles => prevVehicles.map(vehicle => 
        vehicle.id === vehicleId 
          ? name === 'serviceTypes'
            ? { ...vehicle, serviceTypes: value.split(',').map(type => type.trim()) }
            : name.startsWith('latest_service.')
              ? { ...vehicle, latest_service: { ...vehicle.latest_service, [name.split('.')[1]]: newValue } }
              : { ...vehicle, [name]: newValue }
          : vehicle
      ));
    } else {
      setNewVehicle(prev => {
        const updatedVehicle = { ...prev };
        if (name === 'serviceTypes') {
          updatedVehicle.serviceTypes = value.split(',').map(type => type.trim());
        } else if (name.startsWith('latest_service.')) {
          updatedVehicle.latest_service = { ...prev.latest_service, [name.split('.')[1]]: newValue };
        } else {
          updatedVehicle[name] = newValue;
        }

        if (name === 'nhtsaMakeId') {
          const selectedMake = nhtsaMakes.find(m => m.id.toString() === newValue);
          updatedVehicle.nhtsaMakeId = newValue;
          updatedVehicle.make = selectedMake ? selectedMake.name : '';
          updatedVehicle.nhtsaMakeName = selectedMake ? selectedMake.name : '';
          setSelectedNHTSAMakeId(newValue);
          updatedVehicle.model = '';
          updatedVehicle.nhtsaModelId = '';
          updatedVehicle.nhtsaModelName = '';
          setNhtsaModels([]);
        }
        
        if (name === 'nhtsaModelId') {
          const selectedModel = nhtsaModels.find(m => m.id.toString() === newValue);
          updatedVehicle.nhtsaModelId = newValue;
          updatedVehicle.model = selectedModel ? selectedModel.name : '';
          updatedVehicle.nhtsaModelName = selectedModel ? selectedModel.name : '';
        }
        
        return updatedVehicle;
      });
    }
  };

  const handleFetchVINDetails = async () => {
    if (!newVehicle.vin) {
      alert("Please enter a VIN.");
      return;
    }
    setIsFetchingVINDetails(true);
    try {
      const details = await getVehicleDetailsByVin(newVehicle.vin, newVehicle.year || null);
      
      // Check for explicit error code from NHTSA or empty/problematic details
      if (details && details.ErrorCode && details.ErrorCode !== "0" && details.ErrorCode !== "00") { // "00" can also mean success with partial data
        alert(`Error from NHTSA: ${details.ErrorText || 'Unknown error. Code: ' + details.ErrorCode}`);
      } else if (details && (details.ErrorCode === "0" || details.ErrorCode === "00") && details.Results && details.Results.length === 0 && !Object.keys(details).some(k => k !== 'ErrorCode' && k !== 'ErrorText' && k !== 'Results')) {
        // This condition handles cases where NHTSA returns success ("0") but an empty Results array
        // and the details object itself (after my transformation in vehicleApi.js) is empty or only has error/result keys.
        alert("No detailed specifications found for this VIN (NHTSA returned empty results).");
      }
      else if (details && Object.keys(details).length > 0) {
        // Clean the details: remove API specific fields and empty values before applying
        const cleanedDetails = Object.entries(details)
          .filter(([key, value]) => 
            value && value.toString().trim() !== "" && 
            key !== "Error Text" && key !== "ErrorCode" && 
            key !== "Results" && // Assuming 'Results' is the raw array if it gets passed through
            !key.startsWith("AdditionalError")
          )
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});

        if (Object.keys(cleanedDetails).length === 0) {
            alert("No usable vehicle details found for this VIN after cleaning. The API might have returned minimal or error data.");
        } else {
            setNewVehicle(prev => {
            const updatedVehicle = { ...prev };
            
            updatedVehicle.make = cleanedDetails.Make || prev.make;
            updatedVehicle.model = cleanedDetails.Model || prev.model;
            updatedVehicle.year = cleanedDetails.ModelYear || prev.year;
            updatedVehicle.engine_type = cleanedDetails['Engine Configuration'] || prev.engine_type;
            updatedVehicle.fuel_type = cleanedDetails['Fuel Type - Primary'] || prev.fuel_type;
            updatedVehicle.transmission_type = cleanedDetails.TransmissionStyle || prev.transmission_type;
            updatedVehicle.vehicle_type = cleanedDetails.VehicleType || prev.vehicle_type;
            // Add other fields from cleanedDetails as needed
            updatedVehicle.doors = cleanedDetails.Doors || prev.doors;
            updatedVehicle.engine_cylinders = cleanedDetails['Engine Number of Cylinders'] || prev.engine_cylinders;
            updatedVehicle.displacement_cc = cleanedDetails['Displacement (CC)'] || prev.displacement_cc;
            updatedVehicle.displacement_l = cleanedDetails['Displacement (L)'] || prev.displacement_l;
            updatedVehicle.engine_brake_hp = cleanedDetails['Engine Brake (hp) From'] || prev.engine_brake_hp;
            updatedVehicle.drive_type = cleanedDetails.DriveType || prev.drive_type;
            
            // Store all cleaned details for potential future use or display
            updatedVehicle.vinDetails = cleanedDetails; 

            // Attempt to set NHTSA Make ID if make name matches
            const matchedMake = nhtsaMakes.find(m => m.name.toUpperCase() === (cleanedDetails.Make || "").toUpperCase());
            if (matchedMake) {
                updatedVehicle.nhtsaMakeId = matchedMake.id.toString();
                updatedVehicle.nhtsaMakeName = matchedMake.name;
                setSelectedNHTSAMakeId(matchedMake.id.toString()); // This will trigger model refetch
            }
            // Model selection logic can be added here if needed, similar to make

            return updatedVehicle;
            });
            alert("Vehicle details populated from VIN.");
        }
      } else {
        alert("No details found for this VIN, or an unexpected response from the API.");
      }
    } catch (error) {
      console.error("Error fetching VIN details in ManageVehicles:", error);
      alert(`Error fetching VIN details: ${error.message}`);
    }
    setIsFetchingVINDetails(false);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year || !newVehicle.license_plate) {
      alert("Please fill in at least Make, Model, Year, and License Plate.");
      return;
    }
    try {
      const vehicleToAdd = {
        ...newVehicle,
        year: newVehicle.year ? Number(newVehicle.year) : null,
        current_mileage: newVehicle.current_mileage ? Number(newVehicle.current_mileage) : 0,
        seating_capacity: newVehicle.seating_capacity ? Number(newVehicle.seating_capacity) : null,
      };

      await addDoc(collection(db, "vehicles"), vehicleToAdd);
      setNewVehicle(initialNewVehicleState);
      setSelectedNHTSAMakeId('');
      setNhtsaModels([]);
      fetchVehicles();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert(`Error adding vehicle: ${error.message}`);
    }
  };

  const handleEditVehicle = async (id, updatedVehicleData) => {
    try {
      await updateDoc(doc(db, "vehicles", id), updatedVehicleData);
      fetchVehicles();
      setEditingVehicle(null);
    } catch (error) {
      console.error("Error updating vehicle:", error);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await deleteDoc(doc(db, "vehicles", id));
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const toggleExpandVehicle = (vehicleId) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicleId);
    }
  };

  const handleEditInputChange = (e, vehicleId, key) => {
    const updatedVehicles = vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return { ...vehicle, [key]: e.target.value };
      }
      return vehicle;
    });
    setVehicles(updatedVehicles);
  };

  const handleSaveEdit = async (vehicleId) => {
    const updatedVehicle = vehicles.find(vehicle => vehicle.id === vehicleId);
    // Make sure to convert relevant fields to numbers before saving if they were edited as strings
    const vehicleToSave = {
        ...updatedVehicle,
        year: updatedVehicle.year ? Number(updatedVehicle.year) : null,
        current_mileage: updatedVehicle.current_mileage ? Number(updatedVehicle.current_mileage) : 0,
        seating_capacity: updatedVehicle.seating_capacity ? Number(updatedVehicle.seating_capacity) : null,
        // Add other numeric fields here if necessary
    };

    try {
      await updateDoc(doc(db, "vehicles", vehicleId), vehicleToSave);
      setEditingVehicle(null);
      fetchVehicles(); // Refetch to ensure UI is consistent
    } catch (error) {
      console.error("Error updating vehicle:", error);
      alert(`Error updating vehicle: ${error.message}`);
    }
  };

  const formatFieldName = (fieldName) => {
    if (!fieldName) return '';
    // If it contains spaces, assume it's already somewhat formatted (like NHTSA keys)
    if (fieldName.includes(' ')) {
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
    // Original logic for underscore_separated_keys
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCost = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const calculateNextServiceMileage = (currentMileage, serviceInterval) => {
    return currentMileage + serviceInterval;
  };

  const renderVehicleForm = (vehicleData, isEditingForm) => {
    const data = isEditingForm ? vehicles.find(v => v.id === editingVehicle) : newVehicle;
    if (!data && isEditingForm) return <p>Loading edit form...</p>;
    if (!data && !isEditingForm) return <p>Loading add form...</p>;

    const currentData = isEditingForm ? data : newVehicle;
    const handleFormInputChange = (e) => {
        if (isEditingForm) {
            handleEditInputChange(e, editingVehicle, e.target.name);
        } else {
            handleInputChange(e);
        }
    };

    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          {isEditingForm ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-1 lg:col-span-1">
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">VIN</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="vin"
                id="vin"
                value={currentData.vin || ''}
                onChange={handleFormInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
              {!isEditingForm && (
                <button
                  type="button"
                  onClick={handleFetchVINDetails}
                  disabled={isFetchingVINDetails || !currentData.vin}
                  className="mt-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm text-sm disabled:opacity-50 flex items-center"
                >
                  {isFetchingVINDetails ? <FaSpinner className="animate-spin mr-2" /> : null}
                  Fetch
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <label htmlFor="nhtsaMakeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Make (NHTSA)</label>
            <select
              name="nhtsaMakeId"
              id="nhtsaMakeId"
              value={currentData.nhtsaMakeId || ''}
              onChange={handleFormInputChange}
              disabled={isFetchingNHTSAMakes || isEditingForm}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isFetchingNHTSAMakes ? 'Loading makes...' : '-- Select Make --'}</option>
              {nhtsaMakes.map(make => (
                <option key={make.id} value={make.id}>{make.name}</option>
              ))}
            </select>
             <label htmlFor="make" className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Make (Manual/Fetched)</label>
             <input
                type="text"
                name="make"
                id="make"
                value={currentData.make || ''}
                onChange={handleFormInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Make (e.g., Honda, Ford)"
             />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <label htmlFor="nhtsaModelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model (NHTSA)</label>
            <select
              name="nhtsaModelId"
              id="nhtsaModelId"
              value={currentData.nhtsaModelId || ''}
              onChange={handleFormInputChange}
              disabled={isFetchingNHTSAModels || !selectedNHTSAMakeId || isEditingForm}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isFetchingNHTSAModels ? 'Loading models...' : (selectedNHTSAMakeId ? '-- Select Model --' : '-- Select Make First --')}</option>
              {nhtsaModels.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
             <label htmlFor="model" className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Model (Manual/Fetched)</label>
            <input
                type="text"
                name="model"
                id="model"
                value={currentData.model || ''}
                onChange={handleFormInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Model (e.g., Civic, F-150)"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
            <input
              type="number"
              name="year"
              id="year"
              value={currentData.year || ''}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder="YYYY"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">License Plate</label>
            <input
              type="text"
              name="license_plate"
              id="license_plate"
              value={currentData.license_plate || ''}
              onChange={handleFormInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="text"
              name="color"
              id="color"
              value={currentData.color || ''}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Mileage</label>
            <input
              type="number"
              name="current_mileage"
              id="current_mileage"
              value={currentData.current_mileage || ''}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Type</label>
            <input
              type="text"
              name="vehicle_type"
              id="vehicle_type"
              value={currentData.vehicle_type || ''}
              onChange={handleFormInputChange}
              placeholder="e.g., Passenger Car, Truck"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="engine_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Engine Type/Config</label>
            <input
              type="text"
              name="engine_type"
              id="engine_type"
              value={currentData.engine_type || ''}
              onChange={handleFormInputChange}
              placeholder="e.g., V6, I4 Turbo, Electric"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="md:col-span-1">
            <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Type</label>
            <input
              type="text"
              name="fuel_type"
              id="fuel_type"
              value={currentData.fuel_type || ''}
              onChange={handleFormInputChange}
              placeholder="e.g., Gasoline, Diesel, Electric"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              name="status"
              id="status"
              value={currentData.status || 'Active'}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Sold">Sold</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Awaiting Parts">Awaiting Parts</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={isEditingForm ? () => setEditingVehicle(null) : toggleAddForm}
            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isEditingForm ? () => handleSaveEdit(currentData.id) : handleAddVehicle}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {isEditingForm ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Vehicles</h1>
          <button
            onClick={toggleAddForm}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            {showAddForm ? 'Cancel' : 'Add New Vehicle'}
          </button>
        </div>

        {showAddForm && renderVehicleForm(newVehicle, false)}

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">License Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Make</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mileage</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No vehicles found.
                  </td>
                </tr>
              )}
              {vehicles.map((vehicle) => (
                <React.Fragment key={vehicle.id}>
                  <tr 
                    onClick={() => toggleExpandVehicle(vehicle.id)} 
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <Link to={`/vehicles/${vehicle.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                        {vehicle.license_plate}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.make}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.current_mileage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.vin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                        vehicle.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100' :
                        vehicle.status === 'Awaiting Parts' ? 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-100' :
                        vehicle.status === 'Sold' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {vehicle.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={(e) => handleEditClick(e, vehicle)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(vehicle.id); }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  {editingVehicle === vehicle.id && (
                    <tr>
                      <td colSpan="8" className="p-0">
                        {renderVehicleForm(vehicle, true)}
                      </td>
                    </tr>
                  )}
                  {expandedVehicle === vehicle.id && editingVehicle !== vehicle.id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 bg-gray-50 dark:bg-gray-750">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <h4 className="font-semibold">Additional Details:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            <p><strong>Color:</strong> {vehicle.color || 'N/A'}</p>
                            <p><strong>Engine:</strong> {vehicle.engine_type || 'N/A'}</p>
                            <p><strong>Fuel:</strong> {vehicle.fuel_type || 'N/A'}</p>
                            <p><strong>Transmission:</strong> {vehicle.transmission_type || 'N/A'}</p>
                            <p><strong>Vehicle Type (Internal):</strong> {vehicle.vehicle_type || 'N/A'}</p>
                            {vehicle.vinDetails && Object.keys(vehicle.vinDetails).length > 0 && (
                              <div className="col-span-full mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <h5 className="font-semibold">VIN Decoded Details (NHTSA):</h5>
                                <ul className="list-disc list-inside pl-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                                  {Object.entries(vehicle.vinDetails)
                                    .filter(([key, value]) => value && value.trim() !== "" && key !== "Error Code" && key !== "Error Text")
                                    .map(([key, value]) => (
                                      <li key={key} className="truncate">
                                        <span className="font-medium">{formatFieldName(key)}:</span> {value}
                                      </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ManageVehicles;