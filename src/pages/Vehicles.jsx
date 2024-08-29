import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { initializeFirestore } from '../utils/initialiseFirestore';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehicleList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Fetched vehicles:", vehicleList);
      setVehicles(vehicleList);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to fetch vehicles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const toggleExpandVehicle = (vehicleId) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicleId);
    }
  };

  if (loading) return <div>Loading vehicles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vehicles</h1>
        <Link to="/vehicles/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Vehicles
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Make</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Model</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Year</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">License Plate</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">VIN</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {vehicles.map((vehicle) => (
              <React.Fragment key={vehicle.id}>
                <tr 
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleExpandVehicle(vehicle.id)}
                >
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.make}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.model}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.year}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.license_plate}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.vin}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">{vehicle.status}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-gray-800 dark:text-gray-300">
                    {expandedVehicle === vehicle.id ? <FaChevronUp /> : <FaChevronDown />}
                  </td>
                </tr>
                {expandedVehicle === vehicle.id && (
                  <tr>
                    <td colSpan="7" className="p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="grid grid-cols-2 gap-4 text-gray-800 dark:text-gray-300">
                        <p><strong>Vehicle Type:</strong> {vehicle.vehicle_type}</p>
                        <p><strong>Current Mileage:</strong> {vehicle.current_mileage}</p>
                        <p><strong>Color:</strong> {vehicle.color}</p>
                        <p><strong>Purchase Date:</strong> {vehicle.purchase_date}</p>
                        <p><strong>Engine Type:</strong> {vehicle.engine_type}</p>
                        <p><strong>Fuel Type:</strong> {vehicle.fuel_type}</p>
                        <p><strong>Transmission Type:</strong> {vehicle.transmission_type}</p>
                        <p><strong>Seating Capacity:</strong> {vehicle.seating_capacity}</p>
                        <p><strong>Cargo Volume:</strong> {vehicle.cargo_volume}</p>
                        <p><strong>Insured:</strong> {vehicle.insured ? 'Yes' : 'No'}</p>
                        {vehicle.insured && (
                          <>
                            <p><strong>Insurance Provider:</strong> {vehicle.insurance_provider}</p>
                            <p><strong>Insurance Policy Number:</strong> {vehicle.insurance_policy_number}</p>
                          </>
                        )}
                        <p><strong>GPS Tracking Enabled:</strong> {vehicle.gps_tracking_enabled ? 'Yes' : 'No'}</p>
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
  );
};

export default Vehicles;
