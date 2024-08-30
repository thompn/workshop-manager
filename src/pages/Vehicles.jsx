import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllVehicles, getServiceRecordsByVehicle } from '../firebaseOperations';
import { FaCar, FaMotorcycle, FaTruck } from 'react-icons/fa';
import { format } from 'date-fns';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehiclesAndServiceRecords = async () => {
      try {
        const vehiclesData = await getAllVehicles();
        const vehiclesWithServiceRecords = await Promise.all(
          vehiclesData.map(async (vehicle) => {
            const serviceRecords = await getServiceRecordsByVehicle(vehicle.id);
            const latestService = serviceRecords.length > 0
              ? serviceRecords.reduce((latest, current) =>
                  new Date(current.service_date) > new Date(latest.service_date) ? current : latest
                )
              : null;
            return { ...vehicle, latestService };
          })
        );
        setVehicles(vehiclesWithServiceRecords);
      } catch (err) {
        console.error("Error fetching vehicles and service records:", err);
        setError("Failed to fetch vehicles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehiclesAndServiceRecords();
  }, []);

  const getVehicleIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'car':
        return <FaCar className="text-2xl" />;
      case 'motorcycle':
        return <FaMotorcycle className="text-2xl" />;
      case 'truck':
        return <FaTruck className="text-2xl" />;
      default:
        return <FaCar className="text-2xl" />;
    }
  };

  if (loading) return <div>Loading vehicles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vehicles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Link
            key={vehicle.id}
            to={`/vehicles/${vehicle.id}`}
            className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              {getVehicleIcon(vehicle.vehicle_type)}
              <h2 className="text-xl font-semibold ml-2">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </h2>
            </div>
            <p><strong>License Plate:</strong> {vehicle.license_plate}</p>
            <p><strong>VIN:</strong> {vehicle.vin}</p>
            <p><strong>Mileage:</strong> {vehicle.current_mileage}</p>
            <p><strong>Status:</strong> {vehicle.status}</p>
            <p><strong>Last Service:</strong> {
              vehicle.latestService
                ? format(new Date(vehicle.latestService.service_date), 'dd/MM/yyyy')
                : 'No service record'
            }</p>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <Link
          to="/vehicles/manage"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Manage Vehicles
        </Link>
      </div>
    </div>
  );
};

export default Vehicles;
