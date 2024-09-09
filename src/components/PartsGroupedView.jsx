import React, { useState, useEffect } from 'react';
import { getAllParts, getAllSuppliers } from '../firebaseOperations';
import InvoiceViewer from './InvoiceViewer';

const PartsGroupedView = () => {
  const [groupedParts, setGroupedParts] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [partsData, suppliersData] = await Promise.all([getAllParts(), getAllSuppliers()]);
      
      const grouped = partsData.reduce((acc, part) => {
        const supplierId = part.supplier_id || 'unknown';
        const invoiceNumber = part.invoice_number || 'unknown';
        
        if (!acc[supplierId]) {
          acc[supplierId] = {};
        }
        if (!acc[supplierId][invoiceNumber]) {
          acc[supplierId][invoiceNumber] = [];
        }
        acc[supplierId][invoiceNumber].push(part);
        
        return acc;
      }, {});
      
      setGroupedParts(grouped);
      setSuppliers(suppliersData);
    };
    fetchData();
  }, []);

  const handleSupplierChange = (e) => {
    setSelectedSupplier(e.target.value);
    setSelectedInvoice('');
  };

  const handleInvoiceChange = (e) => {
    setSelectedInvoice(e.target.value);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Parts Grouped by Vendor and Invoice</h2>
      <div className="mb-4">
        <select
          value={selectedSupplier}
          onChange={handleSupplierChange}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        >
          <option value="">Select a supplier</option>
          {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </div>
      {selectedSupplier && (
        <div className="mb-4">
          <select
            value={selectedInvoice}
            onChange={handleInvoiceChange}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="">Select an invoice</option>
            {Object.keys(groupedParts[selectedSupplier] || {}).map(invoiceNumber => (
              <option key={invoiceNumber} value={invoiceNumber}>{invoiceNumber}</option>
            ))}
          </select>
        </div>
      )}
      {selectedInvoice && <InvoiceViewer invoiceNumber={selectedInvoice} />}
    </div>
  );
};

export default PartsGroupedView;