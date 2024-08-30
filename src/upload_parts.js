import fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './firebase.js';
import { addNewPart } from './firebaseOperations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadPartsFromCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: The file ${filePath} does not exist.`);
    process.exit(1);
  }

  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true
  }));

  let recordCount = 0;

  for await (const record of parser) {
    try {
      const partData = {
        part_number_oem: record.part_number_oem,
        part_number_vendor: record.part_number_vendor,
        description: record.description,
        category: record.category,
        cost: parseFloat(record.cost) || 0,
        stock_level: parseInt(record.stock_level) || 0,
        reorder_threshold: parseInt(record.reorder_threshold) || 0,
        supplier_id: record.supplier_id,
        location_id: record.location_id || '',
        consumable: record.consumable === 'true',
        vehicle_id: record.vehicle_id,
        invoice_number: record.invoice_number || ''
      };

      // Remove empty fields
      Object.keys(partData).forEach(key => 
        (partData[key] === '' || partData[key] === null || partData[key] === undefined) && delete partData[key]
      );

      await addNewPart(partData);
      recordCount++;
      if (recordCount % 100 === 0) {
        console.log(`Uploaded ${recordCount} records`);
      }
    } catch (error) {
      console.error(`Error adding part: ${record.part_number_oem || record.part_number_vendor}`, error);
    }
  }

  console.log(`CSV upload completed. Total records: ${recordCount}`);
}

// Construct the full path to the CSV file
const csvFilePath = path.join(__dirname, '..', 'parts.csv');
console.log(`Looking for CSV file at: ${csvFilePath}`);

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: The file ${csvFilePath} does not exist.`);
  console.log('Please make sure the parts.csv file is in the root directory of your project.');
  process.exit(1);
}

uploadPartsFromCSV(csvFilePath)
  .then(() => {
    console.log('Upload process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during upload:', error);
    process.exit(1);
  });