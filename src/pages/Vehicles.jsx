import React, { useState } from 'react';
import { FaMotorcycle, FaCar, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const VehicleCard = ({ vehicle }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
    <div className="absolute top-2 right-2">
      {vehicle.type === 'motorcycle' ? (
        <FaMotorcycle className="text-2xl text-blue-500" />
      ) : (
        <FaCar className="text-2xl text-green-500" />
      )}
    </div>
    <h2 className="text-xl font-semibold mb-2">{vehicle.name}</h2>
    <p className="text-gray-600 dark:text-gray-400">Mileage: {vehicle.mileage}</p>
    <p className="text-gray-600 dark:text-gray-400">VIN: {vehicle.vin}</p>
    <Link to={`/vehicles/${vehicle.id}`} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block">
      More Info
    </Link>
  </div>
);

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Updated vehicle data
  const vehicles = [
    { id: 1, name: "BMW K75 Cafe Racer", mileage: 45000, vin: "WB1234567K1234567", type: "motorcycle" },
    { id: 2, name: "KTM 950 Adventure R", mileage: 30000, vin: "VBKVD9409FM123456", type: "motorcycle" },
    { id: 3, name: "BMW K100", mileage: 55000, vin: "WB1234567K7654321", type: "motorcycle" },
    { id: 4, name: "Polestar 2", mileage: 15000, vin: "YS3FD5527N1234567", type: "car" },
    { id: 5, name: "Yamaha XT1200Z", mileage: 20000, vin: "JYARJ16E7LA012345", type: "motorcycle" },
  ];

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedType === 'all' || vehicle.type === selectedType)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Link to="/vehicles/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Vehicles
        </Link>
      </div>
      <div className="mb-6 flex space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search vehicles..."
            className="w-full p-2 pl-8 pr-4 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <select
          className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="car">Cars</option>
          <option value="motorcycle">Motorcycles</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredVehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
};

export default Vehicles;
