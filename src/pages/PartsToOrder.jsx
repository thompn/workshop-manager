import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getAllPartsToOrder,
  addPartToOrder,
  updatePartToOrder,
  deletePartToOrder,
  getAllVehicles, // Import function to get all vehicles
  getAllSuppliers // Import function to get all suppliers
} from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaLink } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';
import { serverTimestamp } from 'firebase/firestore'; // For dateAdded

const STATUS_OPTIONS = ['Pending', 'Ordered', 'Received', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const PartsToOrder = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const initialNewPartOrderState = {
    partNumber: '',
    description: '',
    quantity: 1,
    notes: '',
    vehicleId: '', // New field
    website: '', // New field
    supplierId: '', // New field
    status: 'Pending', // New field
    priority: 'Medium', // New field
    // dateAdded will be handled by the mutation
  };

  const [newPartOrder, setNewPartOrder] = useState(initialNewPartOrderState);
  const [editingPartOrder, setEditingPartOrder] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // For status filtering

  // Fetch parts to order
  const { data: partsToOrder, isLoading: isLoadingPartsToOrder, error: errorPartsToOrder } = useQuery(
    'partsToOrder', 
    getAllPartsToOrder, 
    {
      staleTime: 300000,
      cacheTime: 3600000,
      // Sort by dateAdded descending by default if available, then by priority
      select: data => data?.sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (a.dateAdded && b.dateAdded) {
          // Assuming dateAdded is a Firestore Timestamp or can be converted to Date
          const dateA = a.dateAdded.toDate ? a.dateAdded.toDate() : new Date(a.dateAdded);
          const dateB = b.dateAdded.toDate ? b.dateAdded.toDate() : new Date(b.dateAdded);
          if (dateB - dateA !== 0) return dateB - dateA; // Sort by date descending
        }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0); // Then by priority descending
      }),
    }
  );

  // Fetch vehicles
  const { data: vehicles, isLoading: isLoadingVehicles, error: errorVehicles } = useQuery('vehicles', getAllVehicles, {
    staleTime: 300000,
    cacheTime: 3600000,
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: isLoadingSuppliers, error: errorSuppliers } = useQuery('suppliers', getAllSuppliers, {
    staleTime: 300000,
    cacheTime: 3600000,
  });

  const addPartToOrderMutation = useMutation(
    (partData) => addPartToOrder({ ...partData, dateAdded: serverTimestamp() }), // Add dateAdded here
    {
      onSuccess: () => {
        queryClient.invalidateQueries('partsToOrder');
        setShowAddForm(false);
        setNewPartOrder(initialNewPartOrderState);
        showNotification('Part added to order list!', 'success');
      },
      onError: (error) => showNotification(`Error adding part: ${error.message}`, 'error'),
    }
  );

  const updatePartToOrderMutation = useMutation(
    (variables) => updatePartToOrder(variables.id, variables.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('partsToOrder');
        setEditingPartOrder(null);
        showNotification('Part order updated!', 'success');
      },
      onError: (error) => showNotification(`Error updating part order: ${error.message}`, 'error'),
    }
  );

  const deletePartToOrderMutation = useMutation(deletePartToOrder, {
    onSuccess: () => {
      queryClient.invalidateQueries('partsToOrder');
      showNotification('Part order deleted!', 'success');
    },
    onError: (error) => showNotification(`Error deleting part order: ${error.message}`, 'error'),
  });

  const handleInputChange = (e, stateSetter) => {
    const { name, value, type } = e.target;
    stateSetter(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleAddPartOrder = async (e) => {
    e.preventDefault();
    if (!newPartOrder.partNumber || !newPartOrder.description) {
      showNotification('Part number and description are required.', 'error');
      return;
    }
    addPartToOrderMutation.mutate(newPartOrder);
  };

  const handleEditPartOrder = async (e) => {
    e.preventDefault();
    if (!editingPartOrder || !editingPartOrder.partNumber || !editingPartOrder.description) {
      showNotification('Part number and description are required.', 'error');
      return;
    }
    // Ensure all fields from initial state are present if editing
    const payload = { ...initialNewPartOrderState, ...editingPartOrder };
    updatePartToOrderMutation.mutate({ id: editingPartOrder.id, payload });
  };

  const handleDeletePartOrder = (id) => {
    if (window.confirm('Are you sure you want to delete this part order?')) deletePartToOrderMutation.mutate(id);
  };

  const filteredAndSortedPartsToOrder = partsToOrder?.filter(part => {
    const matchesSearchTerm = part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              part.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || part.status === statusFilter;
    return matchesSearchTerm && matchesStatus;
  }) || [];

  const isLoading = isLoadingPartsToOrder || isLoadingVehicles || isLoadingSuppliers;
  const error = errorPartsToOrder || errorVehicles || errorSuppliers;

  if (isLoading) return <div className="text-center py-8">Loading data...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading data: {error.message}</div>;
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Assuming timestamp is a Firestore Timestamp object
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderPartOrderForm = (partOrder, setPartOrder, submitHandler, buttonText, formTitle) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{formTitle}</h2>
      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Part Number</label>
          <input
            type="text"
            name="partNumber"
            id="partNumber"
            value={partOrder.partNumber}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
            required
          />
        </div>

        {partOrder.partNumber && suppliers && suppliers.length > 0 && (
          <div className="mt-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Quick Supplier Search:</h4>
            <div className="flex flex-wrap gap-2">
              {suppliers.map(supplier => {
                if (!supplier.search_url) return null;
                let supplierSearchUrl = supplier.search_url;
                const encodedPartNumber = encodeURIComponent(partOrder.partNumber);
                if (supplierSearchUrl.includes('%s')) {
                  supplierSearchUrl = supplierSearchUrl.replace('%s', encodedPartNumber);
                } else {
                  supplierSearchUrl = supplierSearchUrl.endsWith('=') ? supplierSearchUrl + encodedPartNumber : supplierSearchUrl + encodedPartNumber;
                }
                return (
                  <a
                    key={supplier.id}
                    href={supplierSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-indigo-700 dark:text-indigo-300 font-medium py-1 px-2 rounded-full inline-flex items-center"
                  >
                    {supplier.name} <FaSearch className="ml-1.5" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <input
            type="text"
            name="description"
            id="description"
            value={partOrder.description}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
            required
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            value={partOrder.quantity}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            min="1"
            className="mt-1 block w-full input-class"
            required
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select
            name="status"
            id="status"
            value={partOrder.status || 'Pending'}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
          >
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
          <select
            name="priority"
            id="priority"
            value={partOrder.priority || 'Medium'}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
          >
            {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
          <textarea
            name="notes"
            id="notes"
            value={partOrder.notes}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            rows="3"
            className="mt-1 block w-full input-class"
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website (Optional)</label>
          <input
            type="url"
            name="website"
            id="website"
            value={partOrder.website}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link to Vehicle (Optional)</label>
          <select
            name="vehicleId"
            id="vehicleId"
            value={partOrder.vehicleId}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
          >
            <option value="">Select Vehicle</option>
            {vehicles?.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate || vehicle.vin}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link to Supplier (Optional)</label>
          <select
            name="supplierId"
            id="supplierId"
            value={partOrder.supplierId}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full input-class"
          >
            <option value="">Select Supplier</option>
            {suppliers?.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          {editingPartOrder && (
            <button
              type="button"
              onClick={() => setEditingPartOrder(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );

  // Define input-class for reusability and consistency with other forms
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Parts to Order</h1>
        <button
          onClick={() => {
            setEditingPartOrder(null);
            setNewPartOrder(initialNewPartOrderState);
            setShowAddForm(!showAddForm);
          }}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
        >
          <FaPlus className="mr-2" /> {showAddForm && !editingPartOrder ? 'Cancel' : 'Add New Part to Order'}
        </button>
      </div>

      {showAddForm && !editingPartOrder && renderPartOrderForm(newPartOrder, setNewPartOrder, handleAddPartOrder, 'Add Part to Order', 'Add New Part to Order List')}
      {editingPartOrder && renderPartOrderForm(editingPartOrder, setEditingPartOrder, handleEditPartOrder, 'Update Part Order', 'Edit Part Order')}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
          <div className="relative mt-1">
            <input
              type="text"
              id="search"
              placeholder="Search by part number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass} // Using the defined input class
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
          <select 
            id="statusFilter" 
            name="statusFilter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className={`mt-1 block w-full ${inputClass}`} // Using the defined input class
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {filteredAndSortedPartsToOrder.length === 0 && !isLoadingPartsToOrder && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No parts currently in the order list. {searchTerm && "Try a different search term."}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedPartsToOrder.map(partOrder => {
          const linkedVehicle = vehicles?.find(v => v.id === partOrder.vehicleId);
          const linkedSupplier = suppliers?.find(s => s.id === partOrder.supplierId);
          const priorityClass = partOrder.priority === 'High' ? 'border-red-500' : partOrder.priority === 'Medium' ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600';

          return (
            <div key={partOrder.id} className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow duration-200 ease-in-out flex flex-col justify-between border-l-4 ${priorityClass}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{partOrder.partNumber}</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{partOrder.description}</p>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button onClick={() => { setShowAddForm(false); setEditingPartOrder(partOrder); }} className="text-blue-500 hover:text-blue-700 p-1" title="Edit"><FaEdit size={16} /></button>
                    <button onClick={() => handleDeletePartOrder(partOrder.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete"><FaTrash size={16} /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <p><strong>Qty:</strong> {partOrder.quantity}</p>
                  <p><strong>Status:</strong> <span className={`font-semibold ${partOrder.status === 'Received' ? 'text-green-600 dark:text-green-400' : partOrder.status === 'Ordered' ? 'text-blue-600 dark:text-blue-400' : ''}`}>{partOrder.status}</span></p>
                  <p><strong>Priority:</strong> {partOrder.priority}</p>
                  <p><strong>Added:</strong> {formatDate(partOrder.dateAdded)}</p>
                  {partOrder.notes && <p><strong>Notes:</strong> {partOrder.notes}</p>}
                  {linkedVehicle && <p><strong>Vehicle:</strong> {`${linkedVehicle.make} ${linkedVehicle.model} (${linkedVehicle.year})`}</p>}
                  {partOrder.website && 
                    <p className="flex items-center"><strong>Website:</strong>
                      <a href={partOrder.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-600 hover:text-indigo-800 truncate max-w-[150px] inline-block">
                        {partOrder.website} <FaLink className="ml-1 inline-block" size={10}/>
                      </a>
                    </p>
                  }
                  {linkedSupplier && <p><strong>Supplier:</strong> {linkedSupplier.name}</p>}
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-2 gap-y-1">
                <a href={`https://www.google.com/search?q=${encodeURIComponent(partOrder.partNumber + " part number")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 inline-flex items-center">
                  Google <FaSearch className="ml-1" />
                </a>
                {linkedSupplier && linkedSupplier.search_url && partOrder.partNumber && (() => {
                  let supplierSearchUrl = linkedSupplier.search_url;
                  const encodedPartNumber = encodeURIComponent(partOrder.partNumber);
                  if (supplierSearchUrl.includes('%s')) {
                    supplierSearchUrl = supplierSearchUrl.replace('%s', encodedPartNumber);
                  } else {
                    supplierSearchUrl = supplierSearchUrl.endsWith('=') ? supplierSearchUrl + encodedPartNumber : supplierSearchUrl + encodedPartNumber;
                  }
                  return (
                    <a href={supplierSearchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-500 hover:text-green-700 inline-flex items-center">
                      {linkedSupplier.name} <FaSearch className="ml-1" />
                    </a>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartsToOrder; 