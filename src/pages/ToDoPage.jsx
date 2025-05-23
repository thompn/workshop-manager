import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Link } from 'react-router-dom';
import { getAllTasksAcrossVehicles, updateTask } from '../firebaseOperations'; // Import updateTask
import { FaCar, FaTools, FaFilter, FaSortAmountDown, FaSortAmountUp, FaUndo } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext'; // For notifications

const TASK_STATUS_OPTIONS = ['To Do', 'In Progress', 'Done', 'Blocked', 'Cancelled'];

const ToDoPage = () => {
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'dateAdded', direction: 'descending' });

  const { data: allTasks, isLoading, error, refetch } = useQuery(
    'allTasksAcrossVehicles',
    getAllTasksAcrossVehicles,
    {
      staleTime: 60000, // 1 minute
    }
  );

  const updateTaskStatusMutation = useMutation(
    async ({ taskId, vehicleId, newStatus }) => {
      // We need to find the original task data to pass to updateTask, 
      // as updateTask might expect the full task object or specific fields.
      // For now, assuming updateTask can handle just the status field.
      // This might need adjustment based on your updateTask implementation.
      const taskToUpdate = allTasks?.find(task => task.id === taskId && task.vehicleId === vehicleId);
      if (!taskToUpdate) throw new Error("Task not found for status update.");
      
      // If updateTask expects the full task object with only status changed:
      // await updateTask(vehicleId, taskId, { ...taskToUpdate, status: newStatus });
      
      // If updateTask can update a partial object (only status):
      await updateTask(vehicleId, taskId, { status: newStatus });
    },
    {
      onSuccess: () => {
        showNotification('Task status updated!', 'success');
        refetch(); // Refetch all tasks to show the update
      },
      onError: (err) => {
        showNotification(`Error updating task status: ${err.message}`, 'error');
      },
    }
  );

  const handleStatusChange = (taskId, vehicleId, newStatus) => {
    updateTaskStatusMutation.mutate({ taskId, vehicleId, newStatus });
  };

  const uniqueVehicles = allTasks 
    ? [
        ...new Map(
          allTasks.map(task => [
            task.vehicleId, 
            `${task.vehicleMake} ${task.vehicleModel} (${task.vehicleLicensePlate || task.vehicleVin || 'N/A'})`
          ])
        ).entries()
      ].map(([id, name]) => ({ id, name }))
    : [];

  const filteredAndSortedTasks = React.useMemo(() => {
    if (!allTasks) return [];
    let tasks = [...allTasks];

    // Filter by search term (task name, description, part name/number)
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.linkedParts && task.linkedParts.some(p => 
          (p.partNumber && p.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        ))
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      tasks = tasks.filter(task => task.status === statusFilter);
    }

    // Filter by vehicle
    if (vehicleFilter !== 'All') {
      tasks = tasks.filter(task => task.vehicleId === vehicleFilter);
    }

    // Sort
    if (sortConfig.key) {
      tasks.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'dateAdded') {
          valA = a.dateAdded?.toDate ? a.dateAdded.toDate() : new Date(0);
          valB = b.dateAdded?.toDate ? b.dateAdded.toDate() : new Date(0);
        }
        // Add other specific comparators if needed (e.g., for vehicle name)

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return tasks;
  }, [allTasks, searchTerm, statusFilter, vehicleFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <FaSortAmountUp className="inline ml-1" /> : <FaSortAmountDown className="inline ml-1" />;
    }
    return null;
  };

  if (isLoading) return <div className="text-center py-10"><p className="text-lg text-gray-600 dark:text-gray-400">Loading To-Do items...</p></div>;
  if (error) return <div className="text-center py-10 text-red-500">Error loading To-Do items: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">To-Do List</h1>
        {/* Future: Add a button to create a new task if desired, though current flow is from parts */}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Tasks</label>
          <input 
            type="text"
            id="searchTerm"
            placeholder="Task name, description, part..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
          <select 
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
          >
            <option value="All">All Statuses</option>
            {TASK_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="vehicleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Vehicle</label>
          <select 
            id="vehicleFilter"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700"
          >
            <option value="All">All Vehicles</option>
            {uniqueVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
          </select>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th onClick={() => requestSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                Task Name {getSortIndicator('name')}
              </th>
              <th onClick={() => requestSort('vehicleMake')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                Vehicle {getSortIndicator('vehicleMake')}
              </th>
              <th onClick={() => requestSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                Status {getSortIndicator('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Linked Parts
              </th>
              <th onClick={() => requestSort('dateAdded')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                Date Added {getSortIndicator('dateAdded')}
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedTasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <Link to={`/vehicles/${task.vehicleId}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    {task.name}
                  </Link>
                  {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</p>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <Link to={`/vehicles/${task.vehicleId}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                    {task.vehicleMake} {task.vehicleModel} ({task.vehicleYear}) <br />
                    <span className="text-xs">{task.vehicleLicensePlate || task.vehicleVin}</span>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <select 
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, task.vehicleId, e.target.value)}
                      className={`p-1 rounded text-xs text-white ${task.status === 'To Do' ? 'bg-blue-500' : task.status === 'In Progress' ? 'bg-yellow-500' : task.status === 'Done' ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      {TASK_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">{opt}</option>)}
                    </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.linkedParts && task.linkedParts.length > 0 ? (
                    <ul className="list-disc list-inside text-xs">
                      {task.linkedParts.slice(0, 2).map((part, index) => (
                        <li key={`${part.partId}-${index}`} className="truncate max-w-[150px]">
                          {part.description || part.partNumber} (x{part.quantityRequired})
                        </li>
                      ))}
                      {task.linkedParts.length > 2 && <li>...and {task.linkedParts.length - 2} more</li>}
                    </ul>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.dateAdded?.toDate ? new Date(task.dateAdded.toDate()).toLocaleDateString() : 'N/A'}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/vehicles/${task.vehicleId}#tasks`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-2">
                    View Vehicle Tasks
                  </Link>
                  {task.status !== 'To Do' && (
                    <button 
                      onClick={() => handleStatusChange(task.id, task.vehicleId, 'To Do')}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Revert to Pending (To Do)"
                    >
                      <FaUndo className="inline" /> Revert
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredAndSortedTasks.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ToDoPage; 