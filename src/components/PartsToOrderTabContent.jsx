import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getAllPartsToOrder,
  addPartToOrder,
  updatePartToOrder,
  deletePartToOrder,
  getAllVehicles,
  getAllSuppliers,
  getAllParts,
  updatePart,
  addNewPart,
  getAllLocations
} from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaLink } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';
import { serverTimestamp } from 'firebase/firestore';
import CreateTaskFromPartsModal from './CreateTaskFromPartsModal';

const STATUS_OPTIONS = ['Pending', 'Ordered', 'Received', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const PartsToOrderTabContent = () => { 
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const initialNewPartOrderState = {
    partNumber: '',
    description: '',
    quantity: 1,
    notes: '',
    vehicleId: '',
    website: '',
    supplierId: '',
    status: 'Pending',
    priority: 'Medium',
  };

  const [newPartOrder, setNewPartOrder] = useState(initialNewPartOrderState);
  const [editingPartOrder, setEditingPartOrder] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPartOrderIds, setSelectedPartOrderIds] = useState(new Set());
  const [showBulkStatusUpdateModal, setShowBulkStatusUpdateModal] = useState(false);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState(STATUS_OPTIONS[0]);
  const [existingStockInfo, setExistingStockInfo] = useState(null);
  const [showReceiveToStockModal, setShowReceiveToStockModal] = useState(false);
  const [partToReceive, setPartToReceive] = useState(null);
  const [receiveToStockStep, setReceiveToStockStep] = useState('initial');
  const [mainInventoryPart, setMainInventoryPart] = useState(null);
  const [newMainInventoryPartData, setNewMainInventoryPartData] = useState({});
  const [mainInventoryCategories, setMainInventoryCategories] = useState([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const [editingStatusPartId, setEditingStatusPartId] = useState(null);

  const initialNewMainInventoryPartDataState = {
    part_number_oem: '',
    part_number_vendor: '',
    description: '',
    stock_level: 0,
    cost: '0.00',
    category: '',
    supplier_id: '',
    reorder_threshold: 0,
    location_id: '',
    consumable: false,
    vehicle_id: '',
    invoice_number: ''
  };

  const { data: partsToOrder, isLoading: isLoadingPartsToOrder, error: errorPartsToOrder } = useQuery(
    'partsToOrder',
    getAllPartsToOrder,
    {
      staleTime: 300000,
      cacheTime: 3600000,
      select: data => data?.sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (a.dateAdded && b.dateAdded) {
          const dateA = a.dateAdded.toDate ? a.dateAdded.toDate() : new Date(a.dateAdded);
          const dateB = b.dateAdded.toDate ? b.dateAdded.toDate() : new Date(b.dateAdded);
          if (dateB - dateA !== 0) return dateB - dateA;
        }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }),
    }
  );

  const { data: vehicles, isLoading: isLoadingVehicles, error: errorVehicles } = useQuery('vehicles', getAllVehicles, {
    staleTime: 300000,
    cacheTime: 3600000,
  });

  const { data: suppliers, isLoading: isLoadingSuppliers, error: errorSuppliers } = useQuery('suppliers', getAllSuppliers, {
    staleTime: 300000,
    cacheTime: 3600000,
    select: data => data?.sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: locations, isLoading: isLoadingLocations, error: errorLocations } = useQuery('locations', getAllLocations, {
    staleTime: 300000,
    cacheTime: 3600000,
    select: data => data?.sort((a, b) => a.name.localeCompare(b.name))
  });

  const { data: parts, isLoading: isLoadingParts, error: errorParts } = useQuery('mainParts', getAllParts);

  const exportToCSV = () => {
    if (!filteredAndSortedPartsToOrder || filteredAndSortedPartsToOrder.length === 0) {
      showNotification('No data to export.', 'info');
      return;
    }
    const headers = [
      'Part Number', 'Description', 'Quantity', 'Status', 'Priority',
      'Date Added', 'Notes', 'Website', 'Linked Vehicle', 'Linked Supplier'
    ];
    const csvRows = [headers.join(',')];
    filteredAndSortedPartsToOrder.forEach(partOrder => {
      const linkedVehicleData = partOrder.vehicleId ? vehicles?.find(v => v.id === partOrder.vehicleId) : null;
      const vehicleDisplay = linkedVehicleData ? `${linkedVehicleData.make} ${linkedVehicleData.model} (${linkedVehicleData.year})` : 'N/A';
      const linkedSupplierData = partOrder.supplierId ? suppliers?.find(s => s.id === partOrder.supplierId) : null;
      const supplierDisplay = linkedSupplierData ? linkedSupplierData.name : 'N/A';
      const formatCsvCell = (data) => {
        const str = String(data === undefined || data === null ? '' : data);
        return `"${str.replace(/"/g, '""')}"`;
      };
      const row = [
        formatCsvCell(partOrder.partNumber),
        formatCsvCell(partOrder.description),
        partOrder.quantity || 0,
        formatCsvCell(partOrder.status),
        formatCsvCell(partOrder.priority),
        formatCsvCell(formatDate(partOrder.dateAdded)),
        formatCsvCell(partOrder.notes),
        formatCsvCell(partOrder.website),
        formatCsvCell(vehicleDisplay),
        formatCsvCell(supplierDisplay)
      ];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'parts_to_order.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Data exported to CSV successfully!', 'success');
  };

  useEffect(() => {
    const checkStock = async (partNumber) => {
      if (!partNumber || partNumber.trim() === '') {
        setExistingStockInfo(null);
        return;
      }
      try {
        const allInventoryParts = await getAllParts();
        const foundPart = allInventoryParts.find(
          p => p.part_number_oem === partNumber || p.part_number_vendor === partNumber
        );
        if (foundPart) {
          setExistingStockInfo({
            stockLevel: foundPart.stock_level,
            description: foundPart.description,
            id: foundPart.id
          });
        } else {
          setExistingStockInfo(null);
        }
      } catch (error) {
        console.error("Error checking existing stock:", error);
        setExistingStockInfo(null);
      }
    };
    if (showAddForm && newPartOrder.partNumber) {
      checkStock(newPartOrder.partNumber);
    } else if (editingPartOrder && editingPartOrder.partNumber) {
      checkStock(editingPartOrder.partNumber);
    } else {
      setExistingStockInfo(null);
    }
  }, [newPartOrder.partNumber, editingPartOrder, showAddForm, partsToOrder]);

  useEffect(() => {
    if (parts) {
      const uniqueCategories = [
        ...new Set(parts.map(part => part.category).filter(cat => cat))
      ].sort((a, b) => a.localeCompare(b));
      setMainInventoryCategories(uniqueCategories);
    }
  }, [parts]);

  const addPartToOrderMutation = useMutation(
    (partData) => addPartToOrder({ ...partData, dateAdded: serverTimestamp() }),
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

  const updateMainInventoryPartMutation = useMutation(
    (variables) => updatePart(variables.id, variables.payload),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('mainParts');
        queryClient.invalidateQueries('partsToOrder');
        const partDescription = variables?.payload?.description || mainInventoryPart?.description || 'Part';
        const newStockLevel = variables?.payload?.stock_level;
        showNotification('Stock for ' + partDescription + ' updated to ' + newStockLevel + '!', 'success');
        setShowReceiveToStockModal(false);
        setPartToReceive(null);
        setNewMainInventoryPartData(initialNewMainInventoryPartDataState);
      },
      onError: (error) => {
        showNotification('Error updating stock: ' + error.message, 'error');
      },
    }
  );

  const addNewMainInventoryPartMutation = useMutation(
    addNewPart,
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('mainParts');
        queryClient.invalidateQueries('partsToOrder');
        const partDescription = variables?.description || 'New part';
        showNotification(partDescription + ' added to main inventory!', 'success');
        setShowReceiveToStockModal(false);
        setPartToReceive(null);
        setNewMainInventoryPartData(initialNewMainInventoryPartDataState);
      },
      onError: (error) => {
        showNotification('Error adding new part to stock: ' + error.message, 'error');
      },
    }
  );

  const handleBulkDelete = async () => {
    if (selectedPartOrderIds.size === 0) {
      showNotification('No items selected for deletion.', 'info');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedPartOrderIds.size} selected part order(s)?`)) {
      const promises = Array.from(selectedPartOrderIds).map(id => deletePartToOrderMutation.mutateAsync(id));
      try {
        await Promise.all(promises);
        showNotification(`${selectedPartOrderIds.size} part order(s) deleted successfully!`, 'success');
        setSelectedPartOrderIds(new Set());
        queryClient.invalidateQueries('partsToOrder');
      } catch (error) {
        showNotification(`Error deleting some part orders: ${error.message}`, 'error');
      }
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedPartOrderIds.size === 0) {
      showNotification('No items selected for status update.', 'info');
      return;
    }
    if (!bulkUpdateStatus) {
      showNotification('Please select a status to apply.', 'error');
      return;
    }
    const promises = Array.from(selectedPartOrderIds).map(id => {
      const partOrder = partsToOrder.find(p => p.id === id);
      if (partOrder) {
        return updatePartToOrderMutation.mutateAsync({ id, payload: { ...partOrder, status: bulkUpdateStatus } });
      }
      return Promise.resolve();
    });
    try {
      await Promise.all(promises);
      showNotification(`${selectedPartOrderIds.size} part order(s) status updated to "${bulkUpdateStatus}"!`, 'success');
      setSelectedPartOrderIds(new Set());
      setShowBulkStatusUpdateModal(false);
      queryClient.invalidateQueries('partsToOrder');
    } catch (error) {
      showNotification(`Error updating some part order statuses: ${error.message}`, 'error');
    }
  };

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

  const isLoading = isLoadingPartsToOrder || isLoadingVehicles || isLoadingSuppliers || isLoadingLocations || isLoadingParts;
  const error = errorPartsToOrder || errorVehicles || errorSuppliers || errorLocations || errorParts;

  if (isLoading) return <div className="text-center py-8">Loading data...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading data: {error.message}</div>;
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
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
            className={`mt-1 block w-full ${inputClass}`}
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
        {existingStockInfo && (showAddForm || editingPartOrder?.partNumber === newPartOrder.partNumber || (editingPartOrder && partOrder.partNumber === editingPartOrder.partNumber) ) && (
           <div className="mt-2 p-3 border border-blue-300 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-gray-700">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Existing Stock Found:</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Part "{existingStockInfo.description}" (matches your input)
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Current Stock Level: <strong>{existingStockInfo.stockLevel}</strong>
            </p>
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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
            className={`mt-1 block w-full ${inputClass}`}
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

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";

  const handleSelectPartOrder = (partOrderId) => {
    setSelectedPartOrderIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(partOrderId)) {
        newSelectedIds.delete(partOrderId);
      } else {
        newSelectedIds.add(partOrderId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAll = () => {
    if (selectedPartOrderIds.size === filteredAndSortedPartsToOrder.length) {
      setSelectedPartOrderIds(new Set());
    } else {
      setSelectedPartOrderIds(new Set(filteredAndSortedPartsToOrder.map(p => p.id)));
    }
  };

  const handleOpenReceiveToStockModal = async (partOrder) => {
    setPartToReceive(partOrder);
    setReceiveToStockStep('initial');
    setMainInventoryPart(null);
    setNewMainInventoryPartData({
      ...initialNewMainInventoryPartDataState,
      part_number_oem: partOrder.partNumber,
      part_number_vendor: partOrder.partNumber,
      description: partOrder.description,
      stock_level: partOrder.quantity,
      supplier_id: partOrder.supplierId || '',
      vehicle_id: partOrder.vehicleId || '',
    });

    if (isLoadingParts) {
      return;
    }
    if (errorParts) {
      showNotification('Error fetching main inventory for stock check: ' + errorParts.message, 'error');
      setShowReceiveToStockModal(false);
      return;
    }
    const foundPart = parts?.find(
      p => p.part_number_oem === partOrder.partNumber || p.part_number_vendor === partOrder.partNumber
    );
    if (foundPart) {
      setMainInventoryPart(foundPart);
      setReceiveToStockStep('confirmUpdate');
    } else {
      setReceiveToStockStep('createNew');
    }
    setShowReceiveToStockModal(true);
  };

  const handleReceiveToStockInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    if (name === 'cost') {
      let tempValue = value.replace(',', '.');
      if (tempValue === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(tempValue)) {
        if (tempValue.startsWith('0') && tempValue.length > 1 && !tempValue.startsWith('0.')) {
            if (/^0[0-9]/.test(tempValue)) {
                 tempValue = tempValue.substring(1);
            }
        }
        processedValue = tempValue;
      } else {
        return;
      }
    }
    
    if (name === 'stock_level' || name === 'reorder_threshold') {
      processedValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = '';
    }

    setNewMainInventoryPartData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleConfirmUpdateStock = async () => {
    if (!mainInventoryPart || !partToReceive) return;
    const updatedStockLevel = (mainInventoryPart.stock_level || 0) + partToReceive.quantity;
    const costInCents = Math.round(parseFloat(newMainInventoryPartData.cost) * 100);
    if (isNaN(costInCents)) {
        showNotification('Invalid cost format. Please enter a valid number.', 'error');
        return;
    }

    updateMainInventoryPartMutation.mutate({
      id: mainInventoryPart.id,
      payload: {
        ...mainInventoryPart,
        stock_level: updatedStockLevel,
        cost: costInCents,
      }
    });
    updatePartToOrderMutation.mutate({ id: partToReceive.id, payload: { status: 'Received' } });
  };

  const handleCreateNewStockItem = async () => {
    if (!newMainInventoryPartData.description || !newMainInventoryPartData.category || !newMainInventoryPartData.supplier_id || !newMainInventoryPartData.location_id ) {
      showNotification('Please fill all required fields for the new part.', 'error');
      return;
    }
    const costInCents = Math.round(parseFloat(newMainInventoryPartData.cost.replace(',', '.')) * 100); 
    if (isNaN(costInCents)) {
        showNotification('Invalid cost format. Please enter a valid number (e.g., 10.50).', 'error');
        return;
    }

    addNewMainInventoryPartMutation.mutate({
      ...newMainInventoryPartData,
      cost: costInCents,
      stock_level: parseInt(newMainInventoryPartData.stock_level, 10) || 0,
      dateAdded: serverTimestamp(),
      dateModified: serverTimestamp(),
    });
    updatePartToOrderMutation.mutate({ id: partToReceive.id, payload: { status: 'Received' } });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div /> 
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
          <div className="relative mt-1">
            <input
              type="text"
              id="search"
              placeholder="Search by part number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
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
            className={`mt-1 block w-full ${inputClass}`}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center h-full"
          >
            <FaLink className="mr-2 h-4 w-4 transform rotate-[-45deg]" />
            Export to CSV
          </button>
        </div>
      </div>

      {filteredAndSortedPartsToOrder.length > 0 && (
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="selectAll"
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
            checked={selectedPartOrderIds.size === filteredAndSortedPartsToOrder.length && filteredAndSortedPartsToOrder.length > 0}
            onChange={handleSelectAll}
            disabled={filteredAndSortedPartsToOrder.length === 0}
          />
          <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select All ({selectedPartOrderIds.size} selected)
          </label>
        </div>
      )}

      {selectedPartOrderIds.size > 0 && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center space-x-3 flex-wrap gap-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Bulk Actions:</span>
          <button
            onClick={() => setShowBulkStatusUpdateModal(true)}
            className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Status
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Selected ({selectedPartOrderIds.size})
          </button>
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Create Task from Selected ({selectedPartOrderIds.size})
          </button>
        </div>
      )}

      {filteredAndSortedPartsToOrder.length === 0 && !isLoadingPartsToOrder && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No parts currently in the order list. {searchTerm && "Try a different search term."}</p>
      )}

      {showBulkStatusUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Update Status for Selected Items</h3>
            <div className="mb-4">
              <label htmlFor="bulkStatusSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
              <select
                id="bulkStatusSelect"
                name="bulkStatusSelect"
                value={bulkUpdateStatus}
                onChange={(e) => setBulkUpdateStatus(e.target.value)}
                className={`mt-1 block w-full ${inputClass}`}
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowBulkStatusUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdateStatus}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Status
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiveToStockModal && partToReceive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center px-4 py-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Receive Part to Stock: <span className="text-indigo-600 dark:text-indigo-400">{partToReceive.partNumber}</span>
            </h3>
            
            {receiveToStockStep === 'initial' && <p className="text-center text-gray-700 dark:text-gray-300">Checking inventory...</p>}

            {receiveToStockStep === 'confirmUpdate' && mainInventoryPart && (
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Part <strong className="text-indigo-600 dark:text-indigo-400">{mainInventoryPart.description}</strong> (OEM: {mainInventoryPart.part_number_oem}, Vendor: {mainInventoryPart.part_number_vendor}) already exists in your main inventory.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  Current Stock Level: <strong className="dark:text-white">{mainInventoryPart.stock_level}</strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Quantity Received from this Order: <strong className="dark:text-white">{partToReceive.quantity}</strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  New Stock Level would be: <strong className="dark:text-white">{(mainInventoryPart.stock_level || 0) + partToReceive.quantity}</strong>
                </p>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowReceiveToStockModal(false);
                      setPartToReceive(null);
                      setNewMainInventoryPartData(initialNewMainInventoryPartDataState);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpdateStock}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                    disabled={updateMainInventoryPartMutation.isLoading}
                  >
                    {updateMainInventoryPartMutation.isLoading ? 'Processing...' : 'Confirm & Update Stock'}
                  </button>
                </div>
              </div>
            )}

            {receiveToStockStep === 'createNew' && (
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  This part number (<strong className="text-indigo-600 dark:text-indigo-400">{partToReceive.partNumber}</strong>) was not found in your main parts inventory.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Please fill in the details below to add it as a new item. Fields marked with * are required.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateNewStockItem(); }} className="space-y-3">
                  <div>
                    <label htmlFor="part_number_oem" className="block text-xs font-medium text-gray-700 dark:text-gray-300">OEM Part Number *</label>
                    <input type="text" name="part_number_oem" value={newMainInventoryPartData.part_number_oem || ''} onChange={handleReceiveToStockInputChange} className={`mt-1 block w-full ${inputClass}`} required />
                  </div>
                  <div>
                    <label htmlFor="part_number_vendor" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Vendor Part Number</label>
                    <input type="text" name="part_number_vendor" value={newMainInventoryPartData.part_number_vendor || ''} onChange={handleReceiveToStockInputChange} className={`mt-1 block w-full ${inputClass}`} />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Description *</label>
                    <input type="text" name="description" value={newMainInventoryPartData.description || ''} onChange={handleReceiveToStockInputChange} className={`mt-1 block w-full ${inputClass}`} required />
                  </div>
                  <div>
                    <label htmlFor="category_receive" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Category *</label>
                    <select
                      name="category"
                      id="category_receive"
                      value={newMainInventoryPartData.category || ''}
                      onChange={handleReceiveToStockInputChange}
                      className={`mt-1 block w-full ${inputClass}`}
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      {mainInventoryCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {!mainInventoryCategories.includes(newMainInventoryPartData.category || '') && (newMainInventoryPartData.category || '') !== '' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        New category "{newMainInventoryPartData.category}" will be created.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="stock_level" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Initial Stock Level *</label>
                    <input type="number" name="stock_level" value={newMainInventoryPartData.stock_level === undefined ? partToReceive.quantity : newMainInventoryPartData.stock_level} onChange={handleReceiveToStockInputChange} className={`mt-1 block w-full ${inputClass}`} min="0" required />
                  </div>
                  <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost per Item (€)</label>
                    <input
                      type="text"
                      name="cost"
                      id="cost"
                      value={newMainInventoryPartData.cost}
                      onChange={handleReceiveToStockInputChange}
                      onBlur={(e) => {
                        let val = e.target.value.replace(',', '.');
                        if (val === '' || val === '.') {
                          setNewMainInventoryPartData(prev => ({ ...prev, cost: '0.00' }));
                        } else {
                          const num = parseFloat(val);
                          if (!isNaN(num)) {
                            setNewMainInventoryPartData(prev => ({ ...prev, cost: num.toFixed(2) }));
                          } else {
                            setNewMainInventoryPartData(prev => ({ ...prev, cost: '0.00' }));
                          }
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="e.g., 10.50"
                    />
                  </div>
                  <div>
                    <label htmlFor="reorder_threshold" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Reorder Threshold</label>
                    <input type="number" name="reorder_threshold" value={newMainInventoryPartData.reorder_threshold || 0} onChange={handleReceiveToStockInputChange} className={`mt-1 block w-full ${inputClass}`} min="0" />
                  </div>
                  <div>
                    <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                    <select
                      name="supplier_id"
                      id="supplier_id"
                      value={newMainInventoryPartData.supplier_id || ''}
                      onChange={handleReceiveToStockInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers && suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <select
                      name="location_id"
                      id="location_id"
                      value={newMainInventoryPartData.location_id || ''}
                      onChange={handleReceiveToStockInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Location</option>
                      {locations && locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center mt-2">
                    <input type="checkbox" name="consumable" id="consumable_receive" checked={newMainInventoryPartData.consumable || false} onChange={handleReceiveToStockInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2" />
                    <label htmlFor="consumable_receive" className="text-xs font-medium text-gray-700 dark:text-gray-300">Is Consumable?</label>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReceiveToStockModal(false);
                        setPartToReceive(null);
                        setNewMainInventoryPartData(initialNewMainInventoryPartDataState);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                      disabled={addNewMainInventoryPartMutation.isLoading}
                    >
                      {addNewMainInventoryPartMutation.isLoading ? 'Processing...' : 'Add New Item to Stock'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
          </div>
        </div>
      )}

      {showCreateTaskModal && (
        <CreateTaskFromPartsModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          selectedPartIds={selectedPartOrderIds}
          partsData={partsToOrder}
        />
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
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3 mt-1"
                      checked={selectedPartOrderIds.has(partOrder.id)}
                      onChange={() => handleSelectPartOrder(partOrder.id)}
                    />
                    <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 inline">{partOrder.partNumber}</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{partOrder.description}</p>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button onClick={() => { setShowAddForm(false); setEditingPartOrder(partOrder); }} className="text-blue-500 hover:text-blue-700 p-1" title="Edit"><FaEdit size={16} /></button>
                    <button onClick={() => handleDeletePartOrder(partOrder.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete"><FaTrash size={16} /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <p><strong>Qty:</strong> {partOrder.quantity}</p>
                  {editingStatusPartId === partOrder.id ? (
                    <div className="flex items-center">
                      <strong className="mr-1">Status:</strong>
                      <select
                        value={partOrder.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          updatePartToOrderMutation.mutate({
                            id: partOrder.id,
                            payload: { status: newStatus }
                          });
                          setEditingStatusPartId(null);
                        }}
                        onBlur={() => setEditingStatusPartId(null)}
                        className="py-0.5 px-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                        autoFocus
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p>
                      <strong>Status:</strong>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStatusPartId(partOrder.id);
                        }}
                        className={`font-semibold cursor-pointer hover:underline ml-1 ${
                          partOrder.status === 'Received' ? 'text-green-600 dark:text-green-400' :
                          partOrder.status === 'Ordered' ? 'text-blue-600 dark:text-blue-400' :
                          '' // Inherits color from parent p for other statuses
                        }`}
                        title="Click to change status"
                      >
                        {partOrder.status}
                      </span>
                    </p>
                  )}
                  <p><strong>Priority:</strong> {partOrder.priority}</p>
                  <p><strong>Added:</strong> {formatDate(partOrder.dateAdded)}</p>
                  {partOrder.notes && <p><strong>Notes:</strong> {partOrder.notes}</p>}
                  {linkedVehicle && <p><strong>Vehicle:</strong> {`${linkedVehicle.make} ${linkedVehicle.model} (${linkedVehicle.year})`}</p>}
                  {partOrder.website &&
                    <p className="flex items-center"><strong>Website:</strong>
                      <a href={partOrder.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-600 hover:text-indigo-800 truncate max-w-[150px] inline-block">
                        {partOrder.website} <FaLink className="ml-1 inline-block" size={10} />
                      </a>
                    </p>
                  }
                  {linkedSupplier && <p><strong>Supplier:</strong> {linkedSupplier.name}</p>}
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-2 gap-y-1 items-center">
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
                {partOrder.status === 'Received' && (
                  <button
                    onClick={() => handleOpenReceiveToStockModal(partOrder)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-md inline-flex items-center"
                  >
                    Receive to Stock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PartsToOrderTabContent; 