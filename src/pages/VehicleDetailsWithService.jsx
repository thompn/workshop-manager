import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, getServiceRecordsByVehicle, deleteServiceRecord, updateServiceRecord, getVehicleTasks, getAllParts, getAllLocations, getAllPartsToOrder, addPartToOrder } from '../firebaseOperations';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
import { getVehicleDetailsByVin } from '../vehicleApi';
import { FaWrench, FaCalendar, FaTachometerAlt, FaUser, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaEdit, FaTrash, FaPrint, FaTasks, FaTools, FaPlus, FaSave, FaTimes, FaClipboardList, FaBarcode, FaPlusCircle, FaSpinner } from 'react-icons/fa';
import ServiceReport from '../components/ServiceReport';
import { useNotification } from '../contexts/NotificationContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import CreateTaskFromPartsModal from '../components/CreateTaskFromPartsModal';
import QuickRequestPartModal from '../components/QuickRequestPartModal';
import { MdMiscellaneousServices } from "react-icons/md";

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
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [selectedTaskForParts, setSelectedTaskForParts] = useState(null);
  const [isQuickRequestModalOpen, setIsQuickRequestModalOpen] = useState(false);
  const [selectedTaskForPartRequest, setSelectedTaskForPartRequest] = useState(null);
  const [isFetchingNHTSADetailsForPage, setIsFetchingNHTSADetailsForPage] = useState(false);

  const queryClient = useQueryClient();

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

  // Fetch partsToOrder
  const { data: partsToOrder, isLoading: isLoadingPartsToOrder } = useQuery(
    'partsToOrderForVehicleDetails', 
    getAllPartsToOrder,
    { staleTime: 60000 }
  );

  // Mutation for creating a part to order
  const createPartToOrderMutation = useMutation(addPartToOrder, {
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries('partsToOrderForVehicleDetails');
      queryClient.invalidateQueries('partsToOrder');
      showNotification(`Part '${variables.part_name}' added to order list.`, 'success');
      setIsQuickRequestModalOpen(false);
      setSelectedTaskForPartRequest(null);
    },
    onError: (error, variables) => {
      showNotification(`Error adding part '${variables.part_name}' to order: ${error.message}`, 'error');
    },
  });

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
        // Log vinDetails as soon as vehicle data is loaded
        if (vehicleData && vehicleData.vinDetails) {
          console.log("[VehicleDetails] Initial vehicle.vinDetails loaded from DB:", JSON.parse(JSON.stringify(vehicleData.vinDetails)));
        } else if (vehicleData) {
          console.log("[VehicleDetails] Initial vehicle data loaded, but no vinDetails field present.");
        }

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

  const handleOpenQuickRequestModal = (task) => {
    setSelectedTaskForPartRequest(task);
    setIsQuickRequestModalOpen(true);
  };

  const formatFieldName = (fieldName) => {
    if (!fieldName) return '';
    if (fieldName.includes(' ') || fieldName.includes('(') || fieldName.includes(')')) {
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFetchAndStoreNHTSADetails = async () => {
    if (!vehicle || !vehicle.vin) {
      showNotification("Vehicle VIN not available.", "warning");
      return;
    }
    setIsFetchingNHTSADetailsForPage(true);
    console.log("[VehicleDetails] Fetching NHTSA details for VIN:", vehicle.vin, "Year:", vehicle.year);
    try {
      const details = await getVehicleDetailsByVin(vehicle.vin, vehicle.year ? vehicle.year.toString() : null);
      console.log("[VehicleDetails] Raw details from API:", JSON.parse(JSON.stringify(details)));

      if (details && details.ErrorCode && details.ErrorCode !== "0" && details.ErrorCode !== "00") {
        showNotification(`NHTSA API Error: ${details.ErrorText || 'Unknown error. Code: ' + details.ErrorCode}`, "error");
        console.error("NHTSA API Error:", details);
      } else if (details && (details.ErrorCode === "0" || details.ErrorCode === "00") && details.Results && details.Results.length === 0 && !Object.keys(details).some(k => k !== 'ErrorCode' && k !== 'ErrorText' && k !== 'Results' && k !== 'Message' && k !== 'SearchCriteria')) {
        showNotification("No detailed specifications found for this VIN (NHTSA returned empty results array but success code).", "info");
        console.log("[VehicleDetails] NHTSA returned success code but empty results array.");
         // Optionally, still store that an attempt was made, maybe with the minimal details like ErrorCode
        // await updateDoc(doc(db, "vehicles", id), { vinDetails: { ErrorCode: details.ErrorCode, Message: "No results" } });
        // setVehicle(prev => ({ ...prev, vinDetails: { ErrorCode: details.ErrorCode, Message: "No results" } }));

      } else if (details && Object.keys(details).length > 0) {
        const cleanedDetails = Object.entries(details)
          .filter(([key, value]) => 
            value && value.toString().trim() !== "" && 
            key !== "Error Text" && key !== "ErrorCode" && 
            key !== "Results" && // Exclude the raw Results array itself from cleaned key-value pairs
            key !== "Message" && key !== "SearchCriteria" && // Exclude other top-level metadata
            !key.startsWith("AdditionalError")
          )
          .reduce((obj, [key, value]) => {
            // Only include primitive values in the final cleanedDetails for direct display
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                 obj[key] = value;
            }
            return obj;
          }, {});
        
        console.log("[VehicleDetails] Cleaned details for storage/display:", JSON.parse(JSON.stringify(cleanedDetails)));

        if (Object.keys(cleanedDetails).length === 0) {
             showNotification("No displayable vehicle specifications found for this VIN after processing.", "info");
             console.log("[VehicleDetails] Cleaned details object is empty.");
             // Store the raw details if cleaned is empty but API call was somewhat successful, for debugging
             // This helps see what was returned if cleaning removed everything.
             // Consider storing a specific marker if you want the UI to reflect "attempted, nothing useful found"
             await updateDoc(doc(db, "vehicles", id), { vinDetails: { fetchAttempted: true, rawResponseErrorCode: details.ErrorCode, message: "No displayable details after cleaning" } });
             setVehicle(prev => ({ ...prev, vinDetails: { fetchAttempted: true, rawResponseErrorCode: details.ErrorCode, message: "No displayable details after cleaning" } }));

        } else {
            await updateDoc(doc(db, "vehicles", id), { vinDetails: cleanedDetails });
            setVehicle(prev => ({ ...prev, vinDetails: cleanedDetails }));
            showNotification("Successfully fetched and stored vehicle specifications from NHTSA.", "success");
        }
      } else {
         // This case handles if 'details' is null, undefined, or an empty object from getVehicleDetailsByVin (e.g., FETCH_ERROR)
         const errorMessage = details?.ErrorText || "Failed to fetch details or API returned no data.";
         showNotification(errorMessage, "error");
         console.log("[VehicleDetails] Failed to fetch details or API returned no data. Details object:", details);
      }
    } catch (error) {
      console.error("Error in handleFetchAndStoreNHTSADetails catch block:", error);
      showNotification(`Client-side error during fetch: ${error.message}`, "error");
    }
    setIsFetchingNHTSADetailsForPage(false);
  };

  if (loading) return <div className="p-4"><FaSpinner className="animate-spin text-xl" /> Loading vehicle details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!vehicle) return <div className="p-4">Vehicle not found</div>;
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
      <h1 className="text-3xl font-bold mb-6 dark:text-white">{vehicle.make} {vehicle.model} ({vehicle.year})</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Vehicle Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>License Plate:</strong> {vehicle.license_plate}</p>
          <p><strong>VIN:</strong> {vehicle.vin || 'N/A'}</p>
          <p><strong>Color:</strong> {vehicle.color || 'N/A'}</p>
          <p><strong>Current Mileage:</strong> {vehicle.current_mileage ? `${vehicle.current_mileage} km` : 'N/A'}</p>
          <p><strong>Status:</strong> {vehicle.status || 'N/A'}</p>
          <p><strong>Purchase Date:</strong> {vehicle.purchase_date || 'N/A'}</p>
          <p><strong>Engine Type (DB):</strong> {vehicle.engine_type || 'N/A'}</p>
          <p><strong>Fuel Type (DB):</strong> {vehicle.fuel_type || 'N/A'}</p>
          <p><strong>Vehicle Type (DB):</strong> {vehicle.vehicle_type || 'N/A'}</p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-3 dark:text-white">NHTSA Vehicle Specifications</h3>
          {/* TEMPORARY: Always show button if VIN exists to allow re-fetch of old format data */}
          {vehicle.vin ? (
            <> 
              {/* Original logic for displaying details or fetchAttempted message (will run after re-fetch) */}
              {vehicle.vinDetails && Object.keys(vehicle.vinDetails).length > 0 && (
                vehicle.vinDetails.fetchAttempted ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <p>{vehicle.vinDetails.message || "Fetch attempted: No displayable vehicle specifications were found after processing."}</p>
                    {vehicle.vinDetails.rawResponseErrorCode && vehicle.vinDetails.rawResponseErrorCode !== "0" && vehicle.vinDetails.rawResponseErrorCode !== "00" && (
                      <p className="mt-1">API issue indicated (Code: {vehicle.vinDetails.rawResponseErrorCode}).</p>
                    )}
                  </div>
                ) : (
                  Object.values(vehicle.vinDetails).some(val => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') && (
                    <ul className="list-disc list-inside pl-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {Object.entries(vehicle.vinDetails)
                        .filter(([key, value]) => {
                          const nonDisplayKeys = ["Results", "ErrorCode", "ErrorText", "Message", "SearchCriteria", "PossibleValues"]; 
                          if (nonDisplayKeys.includes(key)) return false;
                          return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null;
                        })
                        .map(([key, value]) => (
                          <li key={key} className="truncate" title={`${formatFieldName(key)}: ${value === null ? 'N/A' : value}`}>
                            <span className="font-medium">{formatFieldName(key)}:</span> {value === null ? 'N/A' : String(value)}
                          </li>
                      ))}
                    </ul>
                  )
                )
              )}

              {/* Always show the button if VIN is present, to allow re-fetching/overwriting old format */}
              <button
                onClick={handleFetchAndStoreNHTSADetails}
                disabled={isFetchingNHTSADetailsForPage}
                className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm text-sm disabled:opacity-50 flex items-center"
              >
                {isFetchingNHTSADetailsForPage ? (
                  <><FaSpinner className="animate-spin mr-2" /> Fetching...</>
                ) : (
                  '(Re-)Fetch Full Vehicle Specifications (NHTSA)'
                )}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No VIN recorded for this vehicle to fetch specifications.</p>
          )}
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
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button 
                        onClick={() => handleOpenQuickRequestModal(task)}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium py-1 px-2 rounded-md bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                      >
                        <FaPlusCircle className="mr-2" /> Add/Request Part for this Task
                      </button>
                    </div>
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

      {isQuickRequestModalOpen && selectedTaskForPartRequest && (
        <QuickRequestPartModal 
          isOpen={isQuickRequestModalOpen}
          onClose={() => {
            setIsQuickRequestModalOpen(false);
            setSelectedTaskForPartRequest(null);
          }}
          vehicleId={id}
          serviceId={selectedTaskForPartRequest.service_id || expandedRecord?.id}
          allParts={allParts || []} 
          createPartToOrderMutation={createPartToOrderMutation}
        />
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
