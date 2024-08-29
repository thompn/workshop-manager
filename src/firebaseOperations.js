import { db } from './firebase';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Reference to the collections
const vehiclesCollection = collection(db, 'vehicles');
const serviceDataCollection = collection(db, 'service_data');
const ktmServiceTasksCollection = collection(db, 'ktm_service_tasks');
const yamahaTasksCollection = collection(db, 'yamaha_tasks');
const suppliersCollection = collection(db, 'suppliers');
const storageLocationCollection = collection(db, 'storage_location');
const vehicleTypesCollection = collection(db, 'vehicle_types');
const partsCollection = collection(db, 'parts');
const toolsCollection = collection(db, 'tools');

export const vehicleStructure = {
  vehicle_id: 'auto-generated',
  vehicle_type_id: 0,
  license_plate: '',
  vin: '',
  make: '',
  model: '',
  year: 0,
  current_mileage: 0,
  color: '',
  vehicle_type: '',
  purchase_date: null,
  status: '',
  engine_type: '',
  fuel_type: '',
  transmission_type: '',
  seating_capacity: 0,
  cargo_volume: 0,
  insured: false,
  insurance_provider: '',
  insurance_policy_number: '',
  gps_tracking_enabled: false
};

export const serviceDataStructure = {
  service_id: 'auto-generated',
  vehicle_id: '',
  service_date: null,
  service_type: '',
  service_mileage: 0,
  cost: 0,
  brake_pads_checked: false,
  oil_checked: false,
  air_filter_checked: false,
  chain_checked: false,
  fuel_lines_checked: false,
  bearings_checked: false,
  tires_checked: false,
  lights_checked: false,
  battery_checked: false,
  coolant_level_checked: false,
  transmission_fluid_checked: false,
  exhaust_system_checked: false,
  service_details: '',
  notes: '',
  next_service_date: null
};

export const ktmServiceTasksStructure = {
  task_id: 'auto-generated',
  section: '',
  description: '',
  annual_check: false,
  interval_7500: false,
  interval_15000: false,
  interval_22500: false,
  interval_30000: false,
  interval_37500: false,
  interval_45000: false,
  interval_52500: false,
  interval_60000: false,
  interval_67500: false,
  interval_75000: false,
  interval_82500: false,
  interval_90000: false
};

export const yamahaTasksStructure = {
  task_id: 'auto-generated',
  section: '',
  description: '',
  annual_check: false,
  interval_1000: false,
  interval_10000: false,
  interval_20000: false,
  interval_30000: false,
  interval_40000: false
};

export const suppliersStructure = {
  supplier_id: 'auto-generated',
  name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  notes: ''
};

export const storageLocationStructure = {
  location_id: 'auto-generated',
  location_reference: '',
  description: ''
};

export const vehicleTypesStructure = {
  type_id: 'auto-generated',
  vehicle_type: ''
};

export const partsStructure = {
  part_id: 'auto-generated',
  part_number_oem: '',
  part_number_vendor: '',
  description: '',
  category: '',
  cost: 0,
  stock_level: 0,
  reorder_threshold: 0,
  supplier_id: '',
  location_id: '',
  consumable: false
};

export const toolsStructure = {
  tool_id: 'auto-generated',
  tool_name: '',
  type: '',
  location_id: '',
  location: '',
  last_calibration_date: null,
  next_calibration_due: null
};

// Add functions for CRUD operations on each collection
// Example for vehicles:

export async function addNewVehicle(vehicleData) {
  try {
    const docRef = await addDoc(vehiclesCollection, vehicleData);
    console.log("Vehicle added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding vehicle: ", error);
    throw error;
  }
}

export async function getVehicle(vehicleId) {
  try {
    const vehicleDoc = await getDoc(doc(vehiclesCollection, vehicleId));
    if (vehicleDoc.exists()) {
      return { id: vehicleDoc.id, ...vehicleDoc.data() };
    } else {
      console.log("No such vehicle!");
      return null;
    }
  } catch (error) {
    console.error("Error getting vehicle: ", error);
    throw error;
  }
}

// Add similar functions for other collections (serviceData, ktmServiceTasks, yamahaTasks, etc.)
