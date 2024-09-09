import { db } from './firebase';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
  projects: collection(db, 'projects'),
  service_records: collection(db, 'service_records'),
  locations: collection(db, 'locations')
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
  notes: '',
  website: ''
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
  consumable: false,
  vehicle_id: '',
  invoice_number: ''
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

// Add these functions after the existing CRUD operations

export const addNewSupplier = (data) => createDocument('suppliers', data);
export const getSupplier = (id) => readDocument('suppliers', id);
export const updateSupplier = (id, data) => updateDocument('suppliers', id, data);
export const deleteSupplier = (id) => deleteDocument('suppliers', id);
export const getAllSuppliers = () => getAllDocuments('suppliers');

// Add this function to get parts by supplier
export async function getPartsBySupplier(supplierId) {
  try {
    const q = query(collectionsMap.parts, where("supplier_id", "==", supplierId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting parts by supplier: ", error);
    throw error;
  }
}

export const serviceRecordStructure = {
  service_id: 'auto-generated',
  vehicle_id: '',
  service_date: null,
  service_type: '',
  mileage: 0,
  technician: '',
  description: '',
  cost: 0,
  parts_used: [],
  completed_tasks: [],
  notes: ''
};

export const serviceTaskStructure = {
  task_id: 'auto-generated',
  task_name: '',
  description: '',
  estimated_time: 0,
  required_parts: []
};

// Add these functions after the existing CRUD operations
export const addNewServiceRecord = async (data) => {
  try {
    const newDocRef = doc(collectionsMap.service_records);
    await setDoc(newDocRef, { ...data, id: newDocRef.id });
    return newDocRef.id;
  } catch (error) {
    console.error("Error adding new service record: ", error);
    throw error;
  }
};

export const getServiceRecord = (id) => readDocument('service_records', id);
export const updateServiceRecord = (id, data) => updateDocument('service_records', id, data);
export const deleteServiceRecord = (id) => deleteDocument('service_records', id);
export const getAllServiceRecords = () => getAllDocuments('service_records');

export const addNewServiceTask = (data) => createDocument('service_tasks', data);
export const getServiceTask = (id) => readDocument('service_tasks', id);
export const updateServiceTask = (id, data) => updateDocument('service_tasks', id, data);
export const deleteServiceTask = (id) => deleteDocument('service_tasks', id);
export const getAllServiceTasks = async () => {
  try {
    const ktmTasks = await getAllDocuments('ktmServiceTasks');
    const yamahaTasks = await getAllDocuments('yamahaTasks');
    return [...ktmTasks, ...yamahaTasks];
  } catch (error) {
    console.error("Error getting all service tasks:", error);
    throw error;
  }
};

export const getServiceRecordsByVehicle = async (vehicleId) => {
  try {
    const q = query(collectionsMap.service_records, where("vehicle_id", "==", vehicleId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting service records by vehicle: ", error);
    throw error;
  }
};

export const initializeServiceRecordsCollection = async () => {
  const serviceRecordsRef = collection(db, 'service_records');
  const snapshot = await getDocs(serviceRecordsRef);
  if (snapshot.empty) {
    // Collection is empty, add a dummy document to initialize it
    await addDoc(serviceRecordsRef, {
      dummy: true,
      createdAt: new Date()
    });
    console.log('service_records collection initialized');
  }
};

// Add these functions for location management
export const addNewLocation = (data) => createDocument('locations', data);
export const getLocation = (id) => readDocument('locations', id);
export const updateLocation = (id, data) => updateDocument('locations', id, data);
export const deleteLocation = (id) => deleteDocument('locations', id);
export const getAllLocations = () => getAllDocuments('locations');

// Add this structure for locations
export const locationStructure = {
  location_id: 'auto-generated',
  name: '',
  type: '', // e.g., 'tote', 'box', 'drawer'
  description: '',
};

export const getVehicleChecklist = async (vehicleId, serviceType) => {
  try {
    const docRef = doc(db, 'vehicleChecklists', `${vehicleId}_${serviceType}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().tasks || [];
    } else {
      console.log("No checklist found for this vehicle and service type");
      return [];
    }
  } catch (error) {
    console.error("Error fetching vehicle checklist:", error);
    throw error;
  }
};

export const updatePartCount = async (partId, countChange) => {
  try {
    const partRef = doc(collectionsMap.parts, partId);
    const partSnap = await getDoc(partRef);
    if (partSnap.exists()) {
      const currentCount = partSnap.data().stock_level || 0;
      const newCount = Math.max(currentCount + countChange, 0); // Ensure stock level doesn't go below 0
      await updateDoc(partRef, { stock_level: newCount });
      
      // If the new count is 0, we don't delete the part, just update its stock level
      console.log(`Updated stock level for part ${partId}: ${newCount}`);
    } else {
      console.error(`Part with ID ${partId} does not exist.`);
    }
  } catch (error) {
    console.error("Error updating part count:", error);
    throw error;
  }
};

const storage = getStorage();

export const uploadInvoiceToStorage = (file, invoiceNumber, onProgress) => {
  const storageRef = ref(storage, `invoices/${invoiceNumber}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        resolve(storageRef);
      }
    );
  });
};

export const getPartsByInvoiceNumber = async (invoiceNumber) => {
  try {
    const q = query(collectionsMap.parts, where("invoice_number", "==", invoiceNumber));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting parts by invoice number: ", error);
    throw error;
  }
};

export const getPartsByVendor = async (vendorId) => {
  try {
    const q = query(collectionsMap.parts, where("supplier_id", "==", vendorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting parts by vendor: ", error);
    throw error;
  }
};
