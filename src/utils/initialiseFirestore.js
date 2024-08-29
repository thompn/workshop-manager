import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

export const initializeFirestore = async () => {
  try {
    // Add a vehicle with the new schema
    const vehicleRef = await addDoc(collection(db, "vehicles"), {
      vehicle_type_id: 1,
      license_plate: "ABC123",
      vin: "1HGBH41JXMN109186",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      current_mileage: 15000,
      color: "Blue",
      vehicle_type: "Sedan",
      purchase_date: "2020-01-15",
      status: "Active",
      engine_type: "2.5L 4-cylinder",
      fuel_type: "Gasoline",
      transmission_type: "Automatic",
      seating_capacity: 5,
      cargo_volume: 15.1,
      insured: true,
      insurance_provider: "ABC Insurance",
      insurance_policy_number: "POL123456",
      gps_tracking_enabled: false
    });

    console.log("Vehicle added with ID: ", vehicleRef.id);
    return "Firestore initialized successfully";
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    throw error;
  }
};
