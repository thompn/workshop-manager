import { db } from './firebase';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

// Collection references
const collectionsMap = {
  vehicles: collection(db, 'vehicles'),
  serviceData: collection(db, 'service_data'),
  ktmServiceTasks: collection(db, 'ktm_service_tasks'),
  yamahaTasks: collection(db, 'yamaha_tasks'),
  suppliers: collection(db, 'suppliers'),
  storageLocation: collection(db, 'storage_location'),
  vehicleTypes: collection(db, 'vehicle_types'),
  parts: collection(db, 'parts'),
  tools: collection(db, 'tools'),
  projects: collection(db, 'projects')
};

// Generic CRUD operations
const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collectionsMap[collectionName], data);
    console.log(`Document added to ${collectionName} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

const readDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(collectionsMap[collectionName], documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`No such document in ${collectionName}!`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading document from ${collectionName}:`, error);
    throw error;
  }
};

const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(collectionsMap[collectionName], documentId);
    await updateDoc(docRef, data);
    console.log(`Document updated in ${collectionName} with ID: ${documentId}`);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

const deleteDocument = async (collectionName, documentId) => {
  try {
    await deleteDoc(doc(collectionsMap[collectionName], documentId));
    console.log(`Document deleted from ${collectionName} with ID: ${documentId}`);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collectionsMap[collectionName]);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting all documents from ${collectionName}:`, error);
    throw error;
  }
};

// Export generic CRUD operations
export const addNewDocument = createDocument;
export const getDocument = readDocument;
export const updateExistingDocument = updateDocument;
export const removeDocument = deleteDocument;
export const getAllDocumentsFromCollection = getAllDocuments;

// Export specific functions for backward compatibility
export const addNewVehicle = (data) => createDocument('vehicles', data);
export const getVehicle = (id) => readDocument('vehicles', id);
export const updateVehicle = (id, data) => updateDocument('vehicles', id, data);
export const deleteVehicle = (id) => deleteDocument('vehicles', id);
export const getAllVehicles = () => getAllDocuments('vehicles');

export const addNewPart = (data) => createDocument('parts', data);
export const getPart = (id) => readDocument('parts', id);
export const updatePart = (id, data) => updateDocument('parts', id, data);
export const deletePart = (id) => deleteDocument('parts', id);
export const getAllParts = () => getAllDocuments('parts');

// Add similar functions for other collections as needed

// Export data structures
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

// Additional query functions
export async function getPartsByCategory(category) {
  try {
    const q = query(collectionsMap.parts, where("category", "==", category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting parts by category: ", error);
    throw error;
  }
}

export async function getPartsLowOnStock(threshold) {
  try {
    const q = query(collectionsMap.parts, where("stock_level", "<=", threshold));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting parts low on stock: ", error);
    throw error;
  }
}
