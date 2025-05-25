import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaPlusCircle, FaTimes } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';

const QuickRequestPartModal = ({ 
  isOpen, 
  onClose, 
  vehicleId, 
  serviceId, 
  allParts, 
  createPartToOrderMutation 
}) => {
  const { showNotification } = useNotification();

  const [mode, setMode] = useState('search'); // 'search' or 'manual'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventoryPart, setSelectedInventoryPart] = useState(null);
  
  const [partName, setPartName] = useState('');
  const [partNumberOem, setPartNumberOem] = useState('');
  const [quantityToOrder, setQuantityToOrder] = useState('1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Reset form when modal opens or mode changes, or selected part changes
    if (isOpen) {
      if (mode === 'search' && selectedInventoryPart) {
        setPartName(selectedInventoryPart.description || '');
        setPartNumberOem(selectedInventoryPart.part_number_oem || '');
        // Keep quantity and notes as user might be re-selecting
      } else if (mode === 'manual') {
        setSelectedInventoryPart(null); // Clear selected part if switching to manual
        setPartName('');
        setPartNumberOem('');
      }
    } else { // Reset everything when modal closes
      setSearchTerm('');
      setSelectedInventoryPart(null);
      setPartName('');
      setPartNumberOem('');
      setQuantityToOrder('1');
      setNotes('');
      setMode('search');
    }
  }, [isOpen, mode, selectedInventoryPart]);

  const filteredParts = useMemo(() => {
    if (!searchTerm || !allParts) return [];
    return allParts.filter(part => 
      (part.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.part_number_oem?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, allParts]);

  const handleSelectPart = (part) => {
    setSelectedInventoryPart(part);
    setSearchTerm(''); // Clear search term to hide results list
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partName.trim() || !partNumberOem.trim() || !quantityToOrder.trim()) {
      showNotification('Part Name, OEM Number, and Quantity are required.', 'error');
      return;
    }
    const quantity = parseInt(quantityToOrder, 10);
    if (isNaN(quantity) || quantity <= 0) {
      showNotification('Please enter a valid quantity.', 'error');
      return;
    }

    const payload = {
      part_name: partName,
      part_number_oem: partNumberOem,
      quantity_to_order: quantity,
      notes: notes,
      vehicle_id: vehicleId,
      ...(serviceId && { service_id: serviceId }), // Conditionally add service_id
      status: 'Pending', // Default status for new orders
      // cost_per_unit is not set here, assuming backend/mutation handles default or it's set later
    };

    try {
      await createPartToOrderMutation.mutateAsync(payload);
      // Notification of success/error is handled by the mutation's onSuccess/onError
      onClose(); // Close modal on success
    } catch (error) {
      // Error already shown by mutation's onError
      console.error("Failed to create part order:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Request/Add Part to Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setMode('search')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${mode === 'search' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <FaSearch /> Search Existing Part
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${mode === 'manual' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <FaPlusCircle /> Add Manually
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
          {mode === 'search' && (
            <div className="mb-4">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Inventory (Name or OEM No.)
              </label>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Start typing to search..."
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {searchTerm && filteredParts.length > 0 && (
                <ul className="mt-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto dark:border-gray-600">
                  {filteredParts.map(part => (
                    <li 
                      key={part.id} 
                      onClick={() => handleSelectPart(part)}
                      className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                    >
                      {part.description} ({part.part_number_oem}) - Stock: {part.stock_level || 0}
                    </li>
                  ))}
                </ul>
              )}
              {searchTerm && filteredParts.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No parts found matching your search.</p>
              )}
            </div>
          )}
          
          {(mode === 'manual' || (mode === 'search' && selectedInventoryPart)) && (
            <>
              <div className="mb-3">
                <label htmlFor="partName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Part Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="partName" 
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly={mode === 'search' && !!selectedInventoryPart}
                  required 
                />
              </div>

              <div className="mb-3">
                <label htmlFor="partNumberOem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">OEM Part Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="partNumberOem" 
                  value={partNumberOem}
                  onChange={(e) => setPartNumberOem(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly={mode === 'search' && !!selectedInventoryPart}
                  required 
                />
              </div>
            </>
          )}
          
          {/* Common fields visible once a part is selected or in manual mode and fields are populated */}
          { (partName || partNumberOem || mode === 'manual') && (
             <>
                <div className="mb-3">
                    <label htmlFor="quantityToOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity to Order <span className="text-red-500">*</span></label>
                    <input 
                    type="number" 
                    id="quantityToOrder" 
                    value={quantityToOrder}
                    onChange={(e) => setQuantityToOrder(e.target.value)}
                    min="1"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required 
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                    <textarea 
                    id="notes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Supplier preference, urgency, specific instructions for this order item"
                    />
                </div>
            </>
          )}


          <div className="mt-6 flex justify-end space-x-3 border-t pt-4 border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createPartToOrderMutation?.isLoading || (!partName && !partNumberOem)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {createPartToOrderMutation?.isLoading ? 'Adding...' : 'Add to Order List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickRequestPartModal; 