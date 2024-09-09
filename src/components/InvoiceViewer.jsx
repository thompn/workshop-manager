import React, { useState, useEffect } from 'react';
import { getPartsByInvoiceNumber, getInvoiceUrl } from '../firebaseOperations';

const InvoiceViewer = ({ invoiceNumber }) => {
  const [parts, setParts] = useState([]);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const partsData = await getPartsByInvoiceNumber(invoiceNumber);
      setParts(partsData);
      
      if (partsData.length > 0 && partsData[0].invoice_url) {
        setInvoiceUrl(partsData[0].invoice_url);
      }
    };
    fetchData();
  }, [invoiceNumber]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Invoice: {invoiceNumber}</h2>
      {invoiceUrl && (
        <div className="mb-4">
          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
            View Invoice PDF
          </a>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Associated Parts</h3>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="p-2 text-left text-gray-800 dark:text-white">Part Number (OEM)</th>
            <th className="p-2 text-left text-gray-800 dark:text-white">Description</th>
            <th className="p-2 text-left text-gray-800 dark:text-white">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {parts.map(part => (
            <tr key={part.id} className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-2 text-gray-800 dark:text-white">{part.part_number_oem}</td>
              <td className="p-2 text-gray-800 dark:text-white">{part.description}</td>
              <td className="p-2 text-gray-800 dark:text-white">{part.stock_level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceViewer;