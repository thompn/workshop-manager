import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, getServiceRecordsByVehicle, deleteServiceRecord, updateServiceRecord } from '../firebaseOperations';
import { FaWrench, FaCalendar, FaTachometerAlt, FaUser, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaEdit, FaTrash } from 'react-icons/fa';

const VehicleDetailsWithService = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    const fetchVehicleAndServiceRecords = async () => {
      try {
        const vehicleData = await getVehicle(id);
        if (!vehicleData) {
          throw new Error("Vehicle not found");
        }
        setVehicle(vehicleData);

        const serviceRecordsData = await getServiceRecordsByVehicle(id);
        setServiceRecords(serviceRecordsData);
      } catch (err) {
        console.error("Error fetching vehicle and service records:", err);
        setError(err.message || "Failed to fetch vehicle details and service records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleAndServiceRecords();
  }, [id]);

  const toggleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
    setEditingRecord(null);
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
      } catch (error) {
        console.error("Error deleting service record:", error);
        alert('Failed to delete service record. Please try again.');
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
    } catch (error) {
      console.error("Error updating service record:", error);
      alert('Failed to update service record. Please try again.');
    }
  };

  if (loading) return <div>Loading vehicle details and service records...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vehicle) return <div>Vehicle not found</div>;

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
                                      <li key={index}>{part}</li>
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

      <div className="flex justify-between">
        <Link to={`/vehicles/${id}/add-service`} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Add Service Record
        </Link>
        <Link to="/vehicles" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Vehicles
        </Link>
      </div>
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