import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllParts, updatePart, getAllTools, updateTool } from '../firebaseOperations'; // Added tool operations
import { useNotification } from '../contexts/NotificationContext';
import { FaSave, FaSyncAlt, FaSearch, FaPrint, FaTools, FaBoxOpen } from 'react-icons/fa'; // Added new icons

const StockTakePage = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('parts'); // 'parts' or 'tools'
  const [searchTerm, setSearchTerm] = useState('');
  const [physicalCounts, setPhysicalCounts] = useState({}); // { itemId: count }
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Fetch data based on active tab
  const { data: items, isLoading, error } = useQuery(
    ['stockTakeItems', activeTab], // Query key changes with tab
    () => activeTab === 'parts' ? getAllParts() : getAllTools(),
    {
      staleTime: 300000, // 5 minutes
    }
  );

  const partUpdateMutation = useMutation(
    (variables) => updatePart(variables.id, variables.payload),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['stockTakeItems', 'parts']);
        showNotification(`Stock updated for part ${variables.payload.description || variables.id}`, 'success');
      },
      onError: (err, variables) => {
        showNotification(`Failed to update stock for part ${variables.payload.description || variables.id}: ${err.message}`, 'error');
      },
    }
  );

  const toolUpdateMutation = useMutation(
    (variables) => updateTool(variables.id, variables.payload),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['stockTakeItems', 'tools']);
        showNotification(`Quantity updated for tool ${variables.payload.name || variables.id}`, 'success');
      },
      onError: (err, variables) => {
        showNotification(`Failed to update quantity for tool ${variables.payload.name || variables.id}: ${err.message}`, 'error');
      },
    }
  );

  const handlePhysicalCountChange = (itemId, value) => {
    if (value === '' || value === '-') { // Allow empty string or a single minus for brief negative input start
      setPhysicalCounts(prev => ({
        ...prev,
        [itemId]: value === '-' ? '-' : '', // Store '-' temporarily if user is typing a negative, otherwise empty string
      }));
      return;
    }
    const count = parseInt(value, 10);
    // Physical count should not be negative. Discrepancy can be.
    if (isNaN(count) || count < 0) { 
      // If user typed invalid or negative, and it's not just a standalone '-', reset or ignore
      // If it was '-', let them continue, else clear if invalid after being a number
      if (physicalCounts[itemId] !== '-' || value !== '-') {
         setPhysicalCounts(prev => ({
            ...prev,
            [itemId]: '', // Or revert to previous valid count if preferred
        }));
      }
      return;
    }
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: count, // Store the valid, non-negative number
    }));
  };

  const processedItems = useMemo(() => {
    if (!items) return [];
    return items
      .map(item => {
        const isPart = activeTab === 'parts';
        // Ensure systemStock is always a number
        const systemStockNumber = Number(isPart ? (item.stock_level || 0) : (item.quantity || 0));
        const physicalCountState = physicalCounts[item.id]; // Can be string ('', '-') or number
        
        // Ensure countedStockNumber is a number or null
        const countedStockNumber = (physicalCountState === '' || physicalCountState === undefined || physicalCountState === '-') 
                                 ? null 
                                 : Number(physicalCountState);

        const unitCost = item.cost || 0;
        
        let discrepancy = null;
        let systemValue = unitCost * systemStockNumber;
        let countedValue = null;
        let discrepancyValue = null;

        if (countedStockNumber !== null) {
          discrepancy = countedStockNumber - systemStockNumber;
          countedValue = unitCost * countedStockNumber;
          discrepancyValue = unitCost * discrepancy;
        }

        // DEBUGGING LOGS START
        // if (item.displayName === '1/2 Socket Allen 10') { // Log only for the problematic item
        //   console.log('[StockTakePage] Debug for:', item.displayName);
        //   console.log('  System Stock (item.stock_level/quantity):', isPart ? item.stock_level : item.quantity);
        //   console.log('  systemStockNumber:', systemStockNumber, typeof systemStockNumber);
        //   console.log('  physicalCountState (from state):', physicalCountState, typeof physicalCountState);
        //   console.log('  countedStockNumber:', countedStockNumber, typeof countedStockNumber);
        //   console.log('  Calculated Discrepancy:', discrepancy, typeof discrepancy);
        // }
        // DEBUGGING LOGS END

        return {
          ...item,
          displayName: isPart ? item.description : item.name,
          displayIdentifier: isPart ? item.part_number_oem : item.manufacturer,
          unitCost, // Already a number (or 0)
          systemStock: systemStockNumber, // Use the numeric version
          systemValue,
          countedStock: countedStockNumber, // Use the numeric version (or null)
          countedValue,
          discrepancy, // Result of numeric subtraction (or null)
          discrepancyValue,
          isCounted: countedStockNumber !== null,
        };
      })
      .filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          item.displayName?.toLowerCase().includes(term) ||
          item.displayIdentifier?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [items, physicalCounts, searchTerm, activeTab]);

  const itemsToReview = useMemo(() => {
    return processedItems.filter(p => p.isCounted && p.discrepancy !== 0);
  }, [processedItems]);

  const handleReview = () => {
    if (Object.keys(physicalCounts).length === 0) {
      showNotification('No physical counts entered yet.', 'info');
      return;
    }
    // Check if all counted items match system stock
    const allMatch = processedItems
      .filter(item => item.isCounted)
      .every(item => item.discrepancy === 0);

    if (itemsToReview.length === 0 && allMatch) {
        showNotification('All entered counts match system stock. No discrepancies to review.', 'success');
        setIsReviewMode(false);
        return;
    }
    setIsReviewMode(true);
  };
  
  const handleCancelReview = () => {
    setIsReviewMode(false);
  };

  const handleConfirmUpdateAll = async () => {
    if (itemsToReview.length === 0) {
      showNotification('No discrepancies to update.', 'info');
      return;
    }
    let successCount = 0;
    for (const item of itemsToReview) {
      if (item.countedStock !== null && item.systemStock !== item.countedStock) {
        try {
          if (activeTab === 'parts') {
            await partUpdateMutation.mutateAsync({ 
              id: item.id, 
              payload: { ...item, stock_level: item.countedStock } 
            });
          } else {
            await toolUpdateMutation.mutateAsync({ 
              id: item.id, 
              payload: { ...item, quantity: item.countedStock } 
            });
          }
          successCount++;
        } catch (e) {
          // Error notification is handled by mutations
        }
      }
    }
    if (successCount > 0) {
      showNotification(`${successCount} item(s) updated successfully.`, 'success');
    }
    setPhysicalCounts({});
    setIsReviewMode(false);
    queryClient.invalidateQueries(['stockTakeItems', activeTab]); 
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    // Assuming cost is now always in whole currency units (e.g., 100 for €100)
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const totals = useMemo(() => {
    const relevantItems = isReviewMode ? itemsToReview : processedItems.filter(p => p.isCounted);
    return {
      systemValue: relevantItems.reduce((sum, p) => sum + (p.systemValue || 0), 0),
      countedValue: relevantItems.reduce((sum, p) => sum + (p.countedValue || 0), 0),
      discrepancyValue: relevantItems.reduce((sum, p) => sum + (p.discrepancyValue || 0), 0),
    };
  }, [processedItems, itemsToReview, isReviewMode]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="p-4">Loading {activeTab}...</div>;
  if (error) return <div className="p-4">Error loading {activeTab}: {error.message}</div>;

  const displayItems = isReviewMode ? itemsToReview : processedItems;

  // DEBUGGING LOG FOR DISPLAY ITEMS
  // if (displayItems) {
  //   const problemItem = displayItems.find(it => it.displayName === '1/2 Socket Allen 10');
  //   if (problemItem) {
  //     console.log('[StockTakePage] Pre-render check for item:', problemItem.displayName);
  //     console.log('  Discrepancy before render:', problemItem.discrepancy, typeof problemItem.discrepancy);
  //   }
  // }
  // END DEBUGGING LOG

  return (
    <div className="container mx-auto p-4 print-container">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 print-hide">Stock Take & Audit</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 print-hide">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('parts'); setSearchTerm(''); setPhysicalCounts({}); setIsReviewMode(false); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'parts' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}
            `}
          >
            <FaBoxOpen /> Parts Inventory
          </button>
          <button
            onClick={() => { setActiveTab('tools'); setSearchTerm(''); setPhysicalCounts({}); setIsReviewMode(false); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'tools' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}
            `}
          >
            <FaTools /> Tools & Equipment
          </button>
        </nav>
      </div>

      {!isReviewMode && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center print-hide">
          <div className="relative flex-grow w-full sm:w-auto">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full p-2 pl-10 pr-4 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={handleReview}
            disabled={Object.keys(physicalCounts).length === 0}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition duration-150 ease-in-out disabled:opacity-50"
          >
            <FaSyncAlt /> Review {itemsToReview.length > 0 ? `(${itemsToReview.length} Discrepancies)` : '(No Counts Yet)'}
          </button>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition duration-150 ease-in-out"
          >
            <FaPrint /> Print List
          </button>
        </div>
      )}
      
      {isReviewMode && (
        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md print-hide">
          <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Review Discrepancies ({activeTab === 'parts' ? 'Parts' : 'Tools'})</h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            You are about to update system stock for the {activeTab} listed below.
            {itemsToReview.length === 0 && " No items with discrepancies found based on current counts."}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleConfirmUpdateAll}
              disabled={itemsToReview.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition duration-150 ease-in-out disabled:opacity-50"
            >
              <FaSave /> Confirm & Update {itemsToReview.length} Item(s)
            </button>
            <button
              onClick={handleCancelReview}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition duration-150 ease-in-out"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="print-show hidden text-center mb-4">
        <h2 className="text-2xl font-bold">Stock Audit List - {activeTab === 'parts' ? 'Parts Inventory' : 'Tools & Equipment'}</h2>
        <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto print-table-container">
        <table className="w-full min-w-max print-table">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 print-header">
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{activeTab === 'parts' ? 'Description' : 'Name'}</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{activeTab === 'parts' ? 'OEM Part No.' : 'Manufacturer/Type'}</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Cost</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">System Qty</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">System Value</th>
              <th className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider print-physical-count-header">Physical Count</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Counted Value</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider print-discrepancy-header">Discrepancy Qty</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discrepancy Value</th>
            </tr>
          </thead>
          <tbody>
            {(displayItems).map(item => (
              <tr key={item.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out print-row ${item.isCounted && !isReviewMode ? (item.discrepancy === 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900') : ''}`}>
                <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white print-cell">{item.displayName}</td>
                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 print-cell">{item.displayIdentifier || 'N/A'}</td>
                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right print-cell">{formatCurrency(item.unitCost)}</td>
                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right print-cell">{item.systemStock}</td>
                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right print-cell">{formatCurrency(item.systemValue)}</td>
                <td className="p-3 whitespace-nowrap text-sm text-center print-cell print-physical-count-cell">
                  {!isReviewMode ? (
                    <input
                      type="number"
                      value={physicalCounts[item.id] === undefined ? '' : physicalCounts[item.id]}
                      onChange={(e) => handlePhysicalCountChange(item.id, e.target.value)}
                      className="w-20 p-1 border rounded text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-1 focus:ring-indigo-500 print-hide"
                    />
                  ) : (
                    <span className={`font-semibold ${item.countedStock === item.systemStock ? 'text-gray-700 dark:text-gray-300' : 'text-orange-600 dark:text-orange-400'} print-hide`}>
                      {item.countedStock ?? ''}
                    </span>
                  )}
                  <span className="print-only-physical-count hidden print-show">
                    {physicalCounts[item.id] !== undefined && physicalCounts[item.id] !== '' ? physicalCounts[item.id] : '_____'}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right print-cell">{formatCurrency(item.countedValue)}</td>
                <td className={`p-3 whitespace-nowrap text-sm text-right font-semibold print-cell ${item.discrepancy === null ? 'text-gray-500 dark:text-gray-400' : item.discrepancy === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span className="print-hide">
                    {item.discrepancy === null ? '-' : item.discrepancy}
                  </span>
                  <span className="print-show">
                    {item.discrepancy === null ? '_____' : item.discrepancy}
                  </span>
                </td>
                <td className={`p-3 whitespace-nowrap text-sm text-right font-semibold print-cell ${item.discrepancyValue === null ? 'text-gray-500 dark:text-gray-400' : item.discrepancyValue === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(item.discrepancyValue)}
                </td>
              </tr>
            ))}
            {displayItems.length === 0 && (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500 dark:text-gray-400 print-cell">
                  {isReviewMode ? "No discrepancies to review or all counts match system stock." : `No ${activeTab} match your search, or no ${activeTab} in inventory.`}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold print-summary-row">
              <td colSpan="4" className="p-3 text-right text-sm uppercase text-gray-600 dark:text-gray-300">Totals ({activeTab === 'parts' ? 'Parts' : 'Tools'}):</td>
              <td className="p-3 text-right text-sm text-gray-700 dark:text-gray-200">{formatCurrency(totals.systemValue)}</td>
              <td className="p-3 text-center text-sm"></td> 
              <td className="p-3 text-right text-sm text-gray-700 dark:text-gray-200">{formatCurrency(totals.countedValue)}</td>
              <td className="p-3 text-right text-sm"></td> 
              <td className={`p-3 text-right text-sm ${totals.discrepancyValue === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totals.discrepancyValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {(processedItems.length === 0 && !searchTerm && !isLoading) && (
         <div className="text-center p-4 text-gray-500 dark:text-gray-400 print-hide">
            No {activeTab} found in inventory. Add them via the Manage Parts or Manage Tools pages.
        </div>
      )}
    </div>
  );
};

export default StockTakePage; 