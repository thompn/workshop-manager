import React, { useState } from 'react';

const AddEpicModal = ({ isOpen, onClose, onAddEpic }) => {
  const [epicName, setEpicName] = useState('');
  const [epicDescription, setEpicDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddEpic({
      name: epicName,
      description: epicDescription,
      createdAt: new Date(),
    });
    onClose();
    setEpicName('');
    setEpicDescription('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Add New Epic</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="epicName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Epic Name</label>
            <input
              type="text"
              id="epicName"
              value={epicName}
              onChange={(e) => setEpicName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="epicDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              id="epicDescription"
              value={epicDescription}
              onChange={(e) => setEpicDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
              rows="3"
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
              Add Epic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEpicModal;