import React from 'react';
import { useParams } from 'react-router-dom';
import { FaMotorcycle, FaCar, FaWrench, FaCalendar, FaUser, FaTachometerAlt } from 'react-icons/fa';

const VehicleDetails = () => {
  const { id } = useParams();

  // Mock data - replace with actual data fetching logic later
  const vehicle = {
    id: id,
    name: "BMW K75 Cafe Racer",
    type: "motorcycle",
    make: "BMW",
    model: "K75",
    year: 1991,
    mileage: 45000,
    vin: "WB1234567K1234567",
    color: "Black",
    engineSize: "750cc",
    fuelType: "Gasoline",
    transmission: "5-speed manual",
    weight: "227 kg",
    dimensions: {
      length: "2,165 mm",
      width: "880 mm",
      height: "1,195 mm"
    },
    performance: {
      topSpeed: "190 km/h",
      acceleration: "0-100 km/h in 4.6 seconds"
    },
    modifications: [
      "Custom cafe racer seat",
      "LED headlight",
      "Aftermarket exhaust system"
    ],
    serviceRecords: [
      {
        date: "2023-05-15",
        mileage: 44500,
        service: "Oil change and filter replacement",
        technician: "John Doe",
        notes: "Used synthetic oil, replaced air filter as well"
      },
      {
        date: "2023-02-20",
        mileage: 43000,
        service: "New tires installation",
        technician: "Jane Smith",
        notes: "Installed Michelin Road 5 tires"
      },
      {
        date: "2022-11-10",
        mileage: 41500,
        service: "Brake pads replacement",
        technician: "Mike Johnson",
        notes: "Replaced both front and rear brake pads"
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        {vehicle.type === 'motorcycle' ? <FaMotorcycle className="mr-2" /> : <FaCar className="mr-2" />}
        {vehicle.name}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Vehicle Specifications</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Make:</strong> {vehicle.make}</p>
          <p><strong>Model:</strong> {vehicle.model}</p>
          <p><strong>Year:</strong> {vehicle.year}</p>
          <p><strong>Mileage:</strong> {vehicle.mileage} km</p>
          <p><strong>VIN:</strong> {vehicle.vin}</p>
          <p><strong>Color:</strong> {vehicle.color}</p>
          <p><strong>Engine Size:</strong> {vehicle.engineSize}</p>
          <p><strong>Fuel Type:</strong> {vehicle.fuelType}</p>
          <p><strong>Transmission:</strong> {vehicle.transmission}</p>
          <p><strong>Weight:</strong> {vehicle.weight}</p>
        </div>
        <h3 className="text-xl font-semibold mt-4 mb-2">Dimensions</h3>
        <div className="grid grid-cols-3 gap-4">
          <p><strong>Length:</strong> {vehicle.dimensions.length}</p>
          <p><strong>Width:</strong> {vehicle.dimensions.width}</p>
          <p><strong>Height:</strong> {vehicle.dimensions.height}</p>
        </div>
        <h3 className="text-xl font-semibold mt-4 mb-2">Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Top Speed:</strong> {vehicle.performance.topSpeed}</p>
          <p><strong>Acceleration:</strong> {vehicle.performance.acceleration}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Modifications</h2>
        <ul className="list-disc pl-5">
          {vehicle.modifications.map((mod, index) => (
            <li key={index}>{mod}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Service Records</h2>
        {vehicle.serviceRecords.map((record, index) => (
          <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
            <div className="flex items-center mb-2">
              <FaCalendar className="mr-2" />
              <span className="font-semibold">{record.date}</span>
              <FaTachometerAlt className="ml-4 mr-2" />
              <span>{record.mileage} km</span>
            </div>
            <p><strong>Service:</strong> {record.service}</p>
            <p><FaUser className="inline mr-2" /><strong>Technician:</strong> {record.technician}</p>
            <p><strong>Notes:</strong> {record.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleDetails;
