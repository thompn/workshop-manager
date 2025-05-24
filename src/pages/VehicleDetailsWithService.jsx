import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, getServiceRecordsByVehicle, deleteServiceRecord, updateServiceRecord, getVehicleTasks, getAllParts, getAllLocations } from '../firebaseOperations';
import { FaWrench, FaCalendar, FaTachometerAlt, FaUser, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaEdit, FaTrash, FaPrint, FaTasks, FaTools } from 'react-icons/fa';
import ServiceReport from '../components/ServiceReport';
import { useNotification } from '../contexts/NotificationContext';
import { useQuery } from 'react-query';

const VehicleDetailsWithService = () => {
  const { showNotification } = useNotification();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [vehicleTasks, setVehicleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  // Fetch all parts for location lookup
  const { data: allParts, isLoading: isLoadingAllParts, error: errorAllParts } = useQuery(
    'allPartsForVehicleDetails',
    getAllParts,
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Fetch all locations for location lookup
  const { data: allLocations, isLoading: isLoadingAllLocations, error: errorAllLocations } = useQuery(
    'allLocationsForVehicleDetails',
    getAllLocations,
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // New useEffect to log allParts and allLocations when they are loaded
  useEffect(() => {
    if (allParts) {
      console.log("[VehicleDetailsWithService] allParts loaded (for general check):", JSON.parse(JSON.stringify(allParts)));
    }
    if (allLocations) {
      console.log("[VehicleDetailsWithService] allLocations loaded (for general check):", JSON.parse(JSON.stringify(allLocations)));
    }
  }, [allParts, allLocations]);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        const vehicleData = await getVehicle(id);
        if (!vehicleData) {
          throw new Error("Vehicle not found");
        }
        setVehicle(vehicleData);

        const serviceRecordsData = await getServiceRecordsByVehicle(id);
        setServiceRecords(serviceRecordsData);

        const tasksData = await getVehicleTasks(id);
        setVehicleTasks(tasksData);

      } catch (err) {
        console.error("Error fetching vehicle data:", err);
        setError(err.message || "Failed to fetch vehicle details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [id]);

  const toggleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
    setEditingRecord(null);
  };

  const toggleExpandTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleEditClick = (e, record) => {
    e.stopPropagation();
    setEditingRecord(record);
    setExpandedRecord(record.id);
  };

  const handleDeleteClick = async (e, recordId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this service record?')) {
      try {
        await deleteServiceRecord(recordId);
        setServiceRecords(serviceRecords.filter(record => record.id !== recordId));
        showNotification('Service record deleted successfully!', 'success');
      } catch (error) {
        console.error("Error deleting service record:", error);
        showNotification('Failed to delete service record. Please try again.', 'error');
      }
    }
  };

  const handleSaveEdit = async (updatedRecord) => {
    try {
      await updateServiceRecord(updatedRecord.id, updatedRecord);
      setServiceRecords(serviceRecords.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      ));
      setEditingRecord(null);
      showNotification('Service record updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating service record:", error);
      showNotification('Failed to update service record. Please try again.', 'error');
    }
  };

  const handlePrintReport = (e, record) => {
    e.stopPropagation();
    setSelectedServiceRecord(record);
  };

  if (loading) return <div>Loading vehicle details and service records...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vehicle) return <div>Vehicle not found</div>;
  if (isLoadingAllParts) return <div>Loading parts data...</div>;
  if (errorAllParts) return <div>Error loading parts: {errorAllParts.message}</div>;
  if (isLoadingAllLocations) return <div>Loading locations data...</div>;
  if (errorAllLocations) return <div>Error loading locations: {errorAllLocations.message}</div>;

  // Function to get location name for a part
  const getLocationNameForPart = (partId) => {
    console.log(`[getLocationNameForPart] Called for partId: ${partId}`);
    if (!allParts || !allLocations) {
      console.log('[getLocationNameForPart] allParts or allLocations not loaded yet.');
      return null;
    }
    const mainInventoryPart = allParts.find(p => p.id === partId);
    console.log(`[getLocationNameForPart] Found mainInventoryPart for ${partId}:`, mainInventoryPart);

    if (mainInventoryPart && mainInventoryPart.location_id) {
      console.log(`[getLocationNameForPart] Part ${partId} has location_id: ${mainInventoryPart.location_id}`);
      const location = allLocations.find(loc => loc.id === mainInventoryPart.location_id);
      console.log(`[getLocationNameForPart] Found location for ${mainInventoryPart.location_id}:`, location);
      return location ? location.name : null;
    }
    console.log(`[getLocationNameForPart] Part ${partId} has no location_id or part not found in main inventory.`);
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{vehicle.make} {vehicle.model} ({vehicle.year})</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Vehicle Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>License Plate:</strong> {vehicle.license_plate}</p>
          <p><strong>VIN:</strong> {vehicle.vin}</p>
          <p><strong>Color:</strong> {vehicle.color}</p>
          <p><strong>Current Mileage:</strong> {vehicle.current_mileage}</p>
          <p><strong>Status:</strong> {vehicle.status}</p>
          <p><strong>Purchase Date:</strong> {vehicle.purchase_date}</p>
        </div>
        <div className="mt-4">
          <Link 
            to={`/parts?vehicleId=${vehicle.id}`} 
            className="text-blue-500 hover:text-blue-700"
          >
            View Parts for this Vehicle
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Service Records</h2>
        {serviceRecords.length === 0 ? (
          <p>No service records found for this vehicle.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Service Type</th>
                <th className="p-2 text-left">Mileage</th>
                <th className="p-2 text-left">Cost</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr 
                    className="border-b dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleExpandRecord(record.id)}
                  >
                    <td className="p-2">{new Date(record.service_date).toLocaleDateString()}</td>
                    <td className="p-2">{record.service_type}</td>
                    <td className="p-2">{record.mileage}</td>
                    <td className="p-2">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(record.cost)}</td>
                    <td className="p-2">
                      <button
                        onClick={(e) => handleEditClick(e, record)}
                        className="text-yellow-500 hover:text-yellow-700 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, record.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                      <button
                        onClick={(e) => handlePrintReport(e, record)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        <FaPrint />
                      </button>
                    </td>
                  </tr>
                  {expandedRecord === record.id && (
                    <tr>
                      <td colSpan="5" className="p-6 bg-gray-50 dark:bg-gray-900">
                        {editingRecord && editingRecord.id === record.id ? (
                          <EditServiceRecordForm
                            record={editingRecord}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingRecord(null)}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-xl font-semibold mb-4">Service Details</h4>
                              <p className="flex items-center">
                                <FaUser className="inline mr-3" /> 
                                <span><strong>Technician:</strong> {record.technician}</span>
                              </p>
                              <div>
                                <strong>Description:</strong>
                                <p className="mt-1">{record.description}</p>
                              </div>
                              <div>
                                <strong>Notes:</strong>
                                <p className="mt-1">{record.notes || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <h4 className="text-xl font-semibold mb-4">Parts and Tasks</h4>
                              <div>
                                <strong className="block mb-2">Parts Used:</strong>
                                {record.parts_used && record.parts_used.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {record.parts_used.map((part, index) => (
                                      <li key={index}>{part.description || part.part_number_oem || `Part ID: ${part.id}` || 'Unknown Part'}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No parts recorded</p>
                                )}
                              </div>
                              <div>
                                <strong className="block mb-2">Completed Tasks:</strong>
                                {record.completed_tasks && record.completed_tasks.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {record.completed_tasks.map((task, index) => (
                                      <li key={index}>{task}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No tasks recorded</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FaTasks className="mr-3 text-indigo-500" /> To-Do Tasks for this Vehicle
        </h2>
        {vehicleTasks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No tasks found for this vehicle.</p>
        ) : (
          <div className="space-y-4">
            {vehicleTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                  onClick={() => toggleExpandTask(task.id)}
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">{task.name}</h3>
                    <p className={`text-sm font-semibold ${task.status === 'Done' ? 'text-green-500' : task.status === 'In Progress' ? 'text-yellow-500' : 'text-blue-500'}`}>
                      Status: {task.status}
                    </p>
                    {task.linkedParts && task.linkedParts.length > 0 && (() => {
                      const firstPart = task.linkedParts[0];
                      console.log(`[Unexpanded View] Processing firstPart for task '${task.name}':`, firstPart);
                      const currentLocationName = getLocationNameForPart(firstPart.partId);
                      const displayLocation = currentLocationName || firstPart.locationName;
                      console.log(`[Unexpanded View] For part ${firstPart.partId}, currentLocationName: ${currentLocationName}, stored part.locationName: ${firstPart.locationName}, final displayLocation: ${displayLocation}`);
                      
                      return (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Linked Part: {firstPart.description || firstPart.partNumber}
                          (Qty: {firstPart.quantityRequired})
                          {displayLocation && ` - Loc: ${displayLocation}`}
                          {task.linkedParts.length > 1 && ` (+${task.linkedParts.length - 1} more)`}
                        </div>
                      );
                    })()}
                  </div>
                  {expandedTask === task.id ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedTask === task.id && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Description:</strong> {task.description || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      <strong>Date Added:</strong> {task.dateAdded?.toDate ? new Date(task.dateAdded.toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                    {task.linkedParts && task.linkedParts.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                          <FaTools className="mr-2 text-gray-500" /> Linked Parts:
                        </h4>
                        <ul className="list-disc list-inside pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.linkedParts.map((part, index) => {
                            console.log(`[Expanded View] Processing part for task '${task.name}':`, part);
                            const currentLocationName = getLocationNameForPart(part.partId);
                            const displayLocation = currentLocationName || part.locationName;
                            console.log(`[Expanded View] For part ${part.partId}, currentLocationName: ${currentLocationName}, stored part.locationName: ${part.locationName}, final displayLocation: ${displayLocation}`);
                            return (
                              <li key={`${part.partId}-${index}`}>
                                {part.description || part.partNumber} (Qty: {part.quantityRequired})
                                {displayLocation && <span className="text-xs text-gray-500 dark:text-gray-400"> - Location: {displayLocation}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Link to={`/vehicles/${id}/add-service`} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Add Service Record
        </Link>
        <Link to={`/parts?vehicleId=${vehicle.id}`} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">
          View Parts for this Vehicle
        </Link>
        <Link to="/vehicles" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Vehicles
        </Link>
      </div>

      {selectedServiceRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <ServiceReport vehicle={vehicle} serviceRecord={selectedServiceRecord} />
              <div className="items-center px-4 py-3">
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setSelectedServiceRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditServiceRecordForm = ({ record, onSave, onCancel }) => {
  const [editedRecord, setEditedRecord] = useState(record);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedRecord({ ...editedRecord, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedRecord);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Type</label>
        <input
          type="text"
          name="service_type"
          value={editedRecord.service_type}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
        <input
          type="date"
          name="service_date"
          value={editedRecord.service_date}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mileage</label>
          <input
            type="number"
            name="mileage"
            value={editedRecord.mileage}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
        <input
          type="number"
          name="cost"
          value={editedRecord.cost}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Technician</label>
        <input
          type="text"
          name="technician"
          value={editedRecord.technician}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          name="description"
          value={editedRecord.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
        <textarea
          name="notes"
          value={editedRecord.notes}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500">Cancel</button>
      </div>
    </form>
  );
};

export default VehicleDetailsWithService;
