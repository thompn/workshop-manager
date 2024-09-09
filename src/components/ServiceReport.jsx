import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ServiceReport = ({ vehicle, serviceRecord }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const printReport = () => {
    const printContent = document.getElementById('servicePrintContent');
    const windowContent = '<!DOCTYPE html><html><head><title>Print</title>';
    const styles = `
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; }
        #servicePrintContent {
          width: 210mm;
          height: 297mm;
          padding: 20mm;
          box-sizing: border-box;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          #servicePrintContent { page-break-after: always; }
        }
      </style>`;
    const documentContent = windowContent + styles + '</head><body>' + printContent.innerHTML + '</body></html>';
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.open();
    printWindow.document.write(documentContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const docNumber = serviceRecord.id || Date.now().toString();
  const totalCost = serviceRecord.parts_used.reduce((total, part) => total + (parseFloat(part.cost) * part.quantity), 0);

  return (
    <div>
      <div id="servicePrintContent">
        <div className="bg-white text-black p-8 max-w-4xl mx-auto border border-gray-300 shadow-lg">
          <div className="mb-8 text-right">
            <h1 className="text-4xl font-bold">{userProfile?.companyName || 'Company Name Not Set'}</h1>
            <h2 className="text-2xl font-semibold">Service Report</h2>
          </div>

          <div className="mb-6 text-right">
            <p>{userProfile?.address || 'Address Not Set'}</p>
            <p>{userProfile?.city || ''}{userProfile?.postalCode ? `, ${userProfile?.postalCode}` : ''}</p>
            <p>{userProfile?.country || ''}</p>
          </div>

          <div className="mb-6 text-left">
            <p><strong>Date:</strong> {new Date(serviceRecord.service_date).toLocaleDateString()}</p>
            <p><strong>Vehicle Serviced By:</strong> {serviceRecord.technician}</p>
            <p><strong>Service ID:</strong> {docNumber}</p>
          </div>

          <div className="border border-gray-300 p-4 mb-6 text-left">
            <p><strong>Reg. Number:</strong> {vehicle.license_plate}</p>
            <p><strong>Vehicle Description:</strong> {vehicle.make} {vehicle.model} {vehicle.year}</p>
            <p><strong>Chassis No.:</strong> {vehicle.vin}</p>
            <p><strong>Mileage:</strong> {serviceRecord.mileage}</p>
          </div>

          <table className="w-full mb-6 text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">OEM Part Number</th>
                <th className="p-2 text-left">Description of Goods / Services</th>
                <th className="p-2 text-left">Qty.</th>
                <th className="p-2 text-left">Unit Price</th>
                <th className="p-2 text-left">Net Total</th>
              </tr>
            </thead>
            <tbody>
              {serviceRecord.parts_used && serviceRecord.parts_used.map((part, index) => (
                <tr key={index}>
                  <td className="p-2">{part.part_number_oem || 'N/A'}</td>
                  <td className="p-2">{part.description || part.part_number_oem || `Part ID: ${part.id}`}</td>
                  <td className="p-2">{part.quantity}</td>
                  <td className="p-2">{part.cost}</td>
                  <td className="p-2">{(part.quantity * part.cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan="4" className="p-2">Total</td>
                <td className="p-2">{totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mb-6 text-left">
            <h3 className="font-semibold text-lg mb-2 text-left">Completed Tasks:</h3>
            <div>
              {serviceRecord.completed_tasks && serviceRecord.completed_tasks.map((task, index) => (
                <p key={index}>{task}</p>
              ))}
            </div>
          </div>

          <div className="mb-6 text-left">
            <h3 className="font-semibold text-lg mb-2">Notes:</h3>
            <p>{serviceRecord.notes || 'No notes recorded'}</p>
          </div>
        </div>
      </div>
      <div>
        <button onClick={printReport} className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Print Service Report
        </button>
      </div>
    </div>
  );
};

export default ServiceReport;