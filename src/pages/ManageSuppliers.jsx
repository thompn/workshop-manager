import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSuppliers, addNewSupplier, updateSupplier, deleteSupplier } from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaSearch } from 'react-icons/fa';

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    notes: '',
    website: '',
    search_url: ''
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedSupplier, setExpandedSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getAllSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleInputChange = (e, state, setState) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSupplier = async () => {
    try {
      await addNewSupplier(newSupplier);
      setNewSupplier({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        notes: '',
        website: '',
        search_url: ''
      });
      fetchSuppliers();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;
    try {
      await updateSupplier(editingSupplier.id, editingSupplier);
      setEditingSupplier(null);
      setExpandedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id);
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const handleEditClick = (supplierId) => {
    setEditingSupplier(suppliers.find(supplier => supplier.id === supplierId));
    setExpandedSupplier(expandedSupplier === supplierId ? null : supplierId);
  };

  const renderSupplierForm = (supplier, setSupplier, submitHandler, buttonText) => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { name: "name", label: "Name", type: "text" },
        { name: "contact_email", label: "Contact Email", type: "email" },
        { name: "contact_phone", label: "Contact Phone", type: "tel" },
        { name: "address", label: "Address", type: "text" },
        { name: "city", label: "City", type: "text" },
        { name: "state", label: "State", type: "text" },
        { name: "postal_code", label: "Postal Code", type: "text" },
        { name: "country", label: "Country", type: "text" },
        { name: "website", label: "Website", type: "url" },
        { name: "search_url", label: "Search URL", type: "url" },
        { name: "notes", label: "Notes", type: "textarea" },
      ].map((field) => (
        <div key={field.name} className="flex flex-col">
          <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              value={supplier[field.name] || ''}
              onChange={(e) => handleInputChange(e, supplier, setSupplier)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          ) : (
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={supplier[field.name] || ''}
              onChange={(e) => handleInputChange(e, supplier, setSupplier)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          )}
        </div>
      ))}
    </div>
  );

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const currentSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Manage Suppliers</h1>
      
      <div className="mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
        >
          {showAddForm ? 'Hide Add Form' : 'Add Supplier'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Supplier</h2>
          {renderSupplierForm(newSupplier, setNewSupplier, handleAddSupplier, "Add Supplier")}
          <button
            onClick={handleAddSupplier}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Supplier
          </button>
        </div>
      )}

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search suppliers..."
          className="p-2 pl-8 pr-4 border rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left text-gray-800 dark:text-white">Name</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Contact Email</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Contact Phone</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSuppliers.map(supplier => (
              <React.Fragment key={supplier.id}>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-2 text-gray-800 dark:text-white">{supplier.name}</td>
                  <td className="p-2 text-gray-800 dark:text-white">{supplier.contact_email}</td>
                  <td className="p-2 text-gray-800 dark:text-white">{supplier.contact_phone}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEditClick(supplier.id)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="text-xl" />
                    </button>
                  </td>
                </tr>
                {expandedSupplier === supplier.id && (
                  <tr>
                    <td colSpan="4">
                      <div className={`bg-gray-100 dark:bg-gray-800 p-4 transition-all duration-300 ${expandedSupplier === supplier.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {renderSupplierForm(editingSupplier, setEditingSupplier, handleEditSupplier, "Save Changes")}
                        <button
                          onClick={handleEditSupplier}
                          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setExpandedSupplier(null)}
                          className="mt-4 ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ManageSuppliers;