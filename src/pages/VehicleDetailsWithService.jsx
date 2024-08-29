import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicle, getServiceRecordsByVehicle } from '../firebaseOperations';
import { FaWrench, FaCalendar, FaTachometerAlt, FaUser, FaMoneyBillWave } from 'react-icons/fa';

const VehicleDetailsWithService = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <div className="space-y-4">
            {serviceRecords.map((record) => (
              <div key={record.id} className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-2">{record.service_type}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <p><FaCalendar className="inline mr-2" /> {new Date(record.service_date).toLocaleDateString()}</p>
                  <p><FaTachometerAlt className="inline mr-2" /> {record.mileage} miles</p>
                  <p><FaUser className="inline mr-2" /> {record.technician}</p>
                  <p><FaMoneyBillWave className="inline mr-2" /> ${record.cost}</p>
                </div>
                <p className="mt-2"><strong>Description:</strong> {record.description}</p>
                {record.notes && <p className="mt-2"><strong>Notes:</strong> {record.notes}</p>}
              </div>
            ))}
          </div>
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

export default VehicleDetailsWithService;