import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewPart, getAllParts, updatePart, deletePart, getAllVehicles, getAllSuppliers, addNewSupplier, updateSupplier, deleteSupplier, getAllLocations } from '../firebaseOperations';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useParts } from '../context/PartsContext';

const ManageParts = () => {
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
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
  });
  const [editingPart, setEditingPart] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
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
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [suppliersList, setSuppliersList] = useState([]);
  const [showPartsTable, setShowPartsTable] = useState(true);
  const [locations, setLocations] = useState([]);
  const { updateParts, setUpdateParts } = useParts();

  useEffect(() => {
    fetchParts();
    fetchVehicles();
    fetchSuppliers();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (updateParts) {
      fetchParts();
      setUpdateParts(false);
    }
  }, [updateParts]);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData.filter(part => part.stock_level > 0));
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getAllSuppliers();
      setSuppliers(suppliersData);
      setSuppliersList(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const locationsData = await getAllLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleInputChange = (e, state, setState) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleAddPart = async () => {
    try {
      await addNewPart(newPart);
      setNewPart({
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
      });
      fetchParts(); // Ensure the parts list is updated
    } catch (error) {
      console.error("Error adding part:", error);
    }
  };

  const handleEditPart = async () => {
    if (!editingPart) return;
    try {
      await updatePart(editingPart.id, editingPart);
      setEditingPart(null);
      fetchParts(); // Ensure the parts list is updated
    } catch (error) {
      console.error("Error updating part:", error);
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await deletePart(id);
      fetchParts();
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const handleAddSupplier = async () => {
    try {
      await addNewSupplier(newSupplier);
      setNewSupplier({
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
      });
      fetchSuppliers();
      setShowSupplierForm(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;
    try {
      await updateSupplier(editingSupplier.id, editingSupplier);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id);
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  return (
    <div>
      {/* Render parts table and forms */}
    </div>
  );
};

export default ManageParts;