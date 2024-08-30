import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaMotorcycle, FaCar, FaWrench, FaCalendar, FaUser, FaTachometerAlt } from 'react-icons/fa';
import { format } from 'date-fns';

const VehicleDetails = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const docRef = doc(db, "vehicles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVehicle({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such vehicle!");
        }
      } catch (error) {
        console.error("Error fetching vehicle: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  if (loading) {
    return <div>Loading vehicle details...</div>;
  }

  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }

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
        {vehicle.dimensions && (
          <>
            <h3 className="text-xl font-semibold mt-4 mb-2">Dimensions</h3>
            <div className="grid grid-cols-3 gap-4">
              <p><strong>Length:</strong> {vehicle.dimensions.length}</p>
              <p><strong>Width:</strong> {vehicle.dimensions.width}</p>
              <p><strong>Height:</strong> {vehicle.dimensions.height}</p>
            </div>
          </>
        )}
        {vehicle.performance && (
          <>
            <h3 className="text-xl font-semibold mt-4 mb-2">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Top Speed:</strong> {vehicle.performance.topSpeed}</p>
              <p><strong>Acceleration:</strong> {vehicle.performance.acceleration}</p>
            </div>
          </>
        )}
      </div>

      {vehicle.modifications && vehicle.modifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Modifications</h2>
          <ul className="list-disc pl-5">
            {vehicle.modifications.map((mod, index) => (
              <li key={index}>{mod}</li>
            ))}
          </ul>
        </div>
      )}

      {vehicle.serviceRecords && vehicle.serviceRecords.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Service Records</h2>
          {vehicle.serviceRecords.map((record, index) => (
            <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
              <div className="flex items-center mb-2">
                <FaCalendar className="mr-2" />
                <span className="font-semibold">{format(new Date(record.date), 'yyyy-MM-dd')}</span>
                <FaTachometerAlt className="ml-4 mr-2" />
                <span>{record.mileage} km</span>
              </div>
              <p><strong>Service:</strong> {record.service}</p>
              <p><FaUser className="inline mr-2" /><strong>Technician:</strong> {record.technician}</p>
              <p><strong>Notes:</strong> {record.notes}</p>
            </div>
          ))}
        </div>
      )}

      {vehicle.latest_service && (
        <p className="mt-4"><strong>Last Service Date:</strong> {format(new Date(vehicle.latest_service.service_date), 'yyyy-MM-dd')}</p>
      )}
    </div>
  );
};

export default VehicleDetails;
