import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  addNewDocument,
  getAllDocumentsFromCollection,
  partsStructure,
  toolsStructure,
  suppliersStructure,
  locationStructure
} from '../firebaseOperations';

const AdminUpload = () => {
  const [file, setFile] = useState(null);
  const [tableType, setTableType] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTableTypeChange = (e) => {
    setTableType(e.target.value);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const rawHeaders = lines[0].split(',').map(header => header.trim());
    const result = [];

    // Map CSV headers to schema fields if necessary
    const headerMapping = {
      'location': 'location_id',
      'next_maintenance_date': 'next_maintenance_due',
    };

    const headers = rawHeaders.map(header => headerMapping[header] || header);

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const obj = {};
      const currentLine = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        let value = currentLine[j] ? currentLine[j].trim() : '';
        const header = headers[j];

        // Type conversions
        if ((header === 'cost' || header === 'quantity') && value !== '') {
          value = parseFloat(value);
          if (isNaN(value)) value = 0; // Default to 0 if parsing fails
        } else if ((header === 'last_maintenance_date' || header === 'next_maintenance_due') && value !== '') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = Timestamp.fromDate(date);
          } else {
            value = null; // Set to null if date is invalid
          }
        } else if ((header === 'last_maintenance_date' || header === 'next_maintenance_due') && value === '') {
            value = null;
        }

        // Handle potential empty trailing columns in CSV
        if (header) { // Ensure header is not undefined (e.g. trailing commas in header row)
            obj[header] = value;
        }
      }
      result.push(obj);
    }
    return result;
  };

  const validateCSVData = async (parsedData, schema) => {
    const existingData = await getAllDocumentsFromCollection(tableType);
    const errors = [];

    parsedData.forEach((row, index) => {
      Object.keys(schema).forEach(key => {
        // Skip 'id' validation as it's usually auto-generated or not from CSV
        if (key === 'id') return;

        // Special handling for 'tool_id' in 'tools' table
        if (key === 'tool_id' && tableType === 'tools' && schema.tool_id === 'auto-generated') {
          // If schema.tool_id is 'auto-generated', it's not strictly required from CSV
          // if asset_tag (which maps to tool_id) was not provided.
          // If row.tool_id exists (from asset_tag), its type will be checked below.
          if (!row.hasOwnProperty(key) || row[key] === '') {
             // It's okay if tool_id is missing here, Firestore can generate it
             return;
          }
        }

        if (!row.hasOwnProperty(key) && schema[key] !== 'auto-generated') {
          // Check if the field is actually required (not undefined in schema, which means optional)
           if (schema[key] !== undefined) {
             errors.push(`Row ${index + 1}: Missing required field "${key}"`);
           }
        } else if (row.hasOwnProperty(key)) {
          const expectedType = typeof schema[key];
          const actualValue = row[key];
          const actualType = typeof actualValue;

          // Type checking, with special considerations for Timestamps and nulls
          if ((key === 'last_maintenance_date' || key === 'next_maintenance_due')) {
            if (actualValue !== null && !(actualValue instanceof Timestamp)) {
              errors.push(`Row ${index + 1}: Invalid type for field "${key}". Expected Timestamp or null, got ${actualType}`);
            }
          } else if (expectedType === 'number' && actualType === 'string' && schema[key] === 0) { // check if schema default is 0 for numbers
             if (actualValue === '' || isNaN(parseFloat(actualValue))) {
                // Allow empty string for numbers that will default to 0 or be null
             } else if (typeof parseFloat(actualValue) !== 'number') {
                 errors.push(`Row ${index + 1}: Invalid type for field "${key}". Expected ${expectedType}, got ${actualType}`);
             }
          } else if (actualType !== expectedType && schema[key] !== null && schema[key] !== 'auto-generated' && actualValue !== null) {
             // Allow null if schema[key] is a type that could be null (e.g. empty string for string type, 0 for number)
            if (actualValue === null && (schema[key] === '' || typeof schema[key] === 'number' || typeof schema[key] === 'object')) {
              // This is fine
            } else {
              errors.push(`Row ${index + 1}: Invalid type for field "${key}". Expected ${expectedType}, got ${actualType}`);
            }
          }
        }
      });

      // Check for duplicate entries (Ensure this logic is robust for your needs)
      const isDuplicate = existingData.some(existingItem =>
        (row.name && existingItem.name && existingItem.name === row.name) ||
        (row.tool_id && existingItem.tool_id && existingItem.tool_id === row.tool_id) || // Check tool_id for tools
        (row.part_number_oem && existingItem.part_number_oem && existingItem.part_number_oem === row.part_number_oem) // Example for parts
      );

      if (isDuplicate) {
        errors.push(`Row ${index + 1}: Duplicate entry detected (checking name, tool_id, or part_number_oem)`);
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (!file || !tableType) {
      setUploadStatus('Please select a file and table type');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target.result;
      const parsedData = parseCSV(csv);

      const schema = getSchemaForTableType(tableType);
      if (Object.keys(schema).length === 0) {
        setUploadStatus(`Could not determine schema for table type: ${tableType}`);
        return;
      }
      
      const validationErrors = await validateCSVData(parsedData, schema);

      if (validationErrors.length > 0) {
        setUploadStatus(`Validation errors:\n${validationErrors.join('\n')}`);
        return;
      }

      try {
        for (const item of parsedData) {
          // Remove tool_id if it's empty and meant to be auto-generated by Firestore for 'tools'
          if (tableType === 'tools' && item.tool_id === '' && toolsStructure.tool_id === 'auto-generated') {
            delete item.tool_id;
          }
          await addNewDocument(tableType, item);
        }
        setUploadStatus(`Successfully uploaded ${parsedData.length} items to ${tableType}`);
      } catch (error) {
        setUploadStatus(`Error uploading data: ${error.message}`);
      }
    };

    reader.readAsText(file);
  };

  const getSchemaForTableType = (type) => {
    switch (type) {
      case 'parts':
        return partsStructure;
      case 'tools':
        return toolsStructure;
      case 'suppliers':
        return suppliersStructure;
      case 'locations': // Assuming you have a locationStructure imported
        return locationStructure;
      default:
        return {};
    }
  };

  return (
    <div className="container mx-auto p-4 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Admin CSV Upload</h1>
      <div className="mb-4">
        <label className="block mb-2 dark:text-gray-300">Select Table Type:</label>
        <select
          value={tableType}
          onChange={handleTableTypeChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select a table</option>
          <option value="parts">Parts</option>
          <option value="tools">Tools</option>
          <option value="suppliers">Suppliers</option>
          <option value="locations">Locations</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 dark:text-gray-300">Select CSV File:</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <button
        onClick={handleUpload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800"
      >
        Upload CSV
      </button>
      {uploadStatus && (
        <div className="mt-4 p-4 bg-gray-100 rounded dark:bg-gray-800 dark:text-gray-200">
          <pre>{uploadStatus}</pre>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;