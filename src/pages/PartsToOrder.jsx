import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllPartsToOrder, addPartToOrder, updatePartToOrder, deletePartToOrder } from '../firebaseOperations'; // Assuming these functions will be created
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';

const PartsToOrder = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const [newPartOrder, setNewPartOrder] = useState({
    partNumber: '',
    description: '',
    quantity: 1,
    notes: '',
  });
  const [editingPartOrder, setEditingPartOrder] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: partsToOrder, isLoading, error } = useQuery('partsToOrder', getAllPartsToOrder, {
    staleTime: 300000, // 5 minutes
    cacheTime: 3600000, // 1 hour
  });

  const addPartToOrderMutation = useMutation(addPartToOrder, {
    onSuccess: () => {
      queryClient.invalidateQueries('partsToOrder');
      setShowAddForm(false);
      setNewPartOrder({ partNumber: '', description: '', quantity: 1, notes: '' });
      showNotification('Part added to order list!', 'success');
    },
    onError: (error) => {
      showNotification(`Error adding part: ${error.message}`, 'error');
    }
  });

  const updatePartToOrderMutation = useMutation(
    (variables) => updatePartToOrder(variables.id, variables.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('partsToOrder');
        setEditingPartOrder(null);
        showNotification('Part order updated!', 'success');
      },
      onError: (error) => {
        showNotification(`Error updating part order: ${error.message}`, 'error');
      }
    }
  );

  const deletePartToOrderMutation = useMutation(deletePartToOrder, {
    onSuccess: () => {
      queryClient.invalidateQueries('partsToOrder');
      showNotification('Part order deleted!', 'success');
    },
    onError: (error) => {
      showNotification(`Error deleting part order: ${error.message}`, 'error');
    }
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
    if (!editingPartOrder.partNumber || !editingPartOrder.description) {
      showNotification('Part number and description are required.', 'error');
      return;
    }
    updatePartToOrderMutation.mutate({ id: editingPartOrder.id, payload: editingPartOrder });
  };

  const handleDeletePartOrder = (id) => {
    if (window.confirm('Are you sure you want to delete this part order?')) {
      deletePartToOrderMutation.mutate(id);
    }
  };

  const filteredPartsToOrder = partsToOrder?.filter(part => 
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="text-center py-8">Loading parts to order...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading parts to order: {error.message}</div>;

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
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <input
            type="text"
            name="description"
            id="description"
            value={partOrder.description}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
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
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
          <textarea
            name="notes"
            id="notes"
            value={partOrder.notes}
            onChange={(e) => handleInputChange(e, setPartOrder)}
            rows="3"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        {/* Optional: Web search integration can be added here */}
        {/* Example:
        {partOrder.partNumber && (
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(partOrder.partNumber + " part number")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm inline-flex items-center mt-2"
          >
            Search for this part number online <FaSearch className="ml-1" />
          </a>
        )}
        */}
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Parts to Order</h1>
        <button
          onClick={() => {
            setEditingPartOrder(null); // Clear any editing state
            setShowAddForm(!showAddForm);
          }}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
        >
          <FaPlus className="mr-2" /> {showAddForm ? 'Cancel' : 'Add New Part to Order'}
        </button>
      </div>

      {showAddForm && !editingPartOrder && renderPartOrderForm(newPartOrder, setNewPartOrder, handleAddPartOrder, 'Add Part to Order', 'Add New Part to Order List')}
      {editingPartOrder && renderPartOrderForm(editingPartOrder, setEditingPartOrder, handleEditPartOrder, 'Update Part Order', 'Edit Part Order')}

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by part number or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>

      {filteredPartsToOrder.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No parts currently in the order list. {searchTerm && "Try a different search term."}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartsToOrder.map(partOrder => (
          <div key={partOrder.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow duration-200 ease-in-out">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{partOrder.partNumber}</h3>
                <p className="text-gray-700 dark:text-gray-300">{partOrder.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowAddForm(false); // Close add form if open
                    setEditingPartOrder(partOrder);
                  }}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                  title="Edit"
                >
                  <FaEdit size={18} />
                </button>
                <button
                  onClick={() => handleDeletePartOrder(partOrder.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                  title="Delete"
                >
                  <FaTrash size={18} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Quantity:</strong> {partOrder.quantity}</p>
            {partOrder.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2"><strong>Notes:</strong> {partOrder.notes}</p>
            )}
             {/* Optional: Web search integration can be added here */}
            {partOrder.partNumber && (
              <div className="mt-3">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(partOrder.partNumber + " part number")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 inline-flex items-center"
                >
                  Search for this part number <FaSearch className="ml-1" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartsToOrder; 