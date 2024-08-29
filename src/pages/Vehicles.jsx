import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { initializeFirestore } from '../utils/initialiseFirestore';
import { Link } from 'react-router-dom';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Loading vehicles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Link to="/vehicles/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Vehicles
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-700">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Make</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Model</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Year</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">License Plate</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">VIN</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-700">
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.make}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.model}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.year}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.license_plate}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.vin}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-300">{vehicle.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vehicles;
