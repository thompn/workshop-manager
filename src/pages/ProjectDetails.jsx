import React from 'react';
import { useParams } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaUser, FaCalendar } from 'react-icons/fa';

const ProjectDetails = () => {
  const { id } = useParams();

  // Mock data - replace with actual data fetching logic later
  const project = {
    id: id,
    name: "Website Redesign",
    description: "Overhaul the company website with a modern, responsive design",
    status: "In Progress",
    startDate: "2023-05-01",
    dueDate: "2023-08-31",
    completedTasks: 15,
    inProgressTasks: 8,
    blockedTasks: 2,
    teamMembers: ["Alice", "Bob", "Charlie"],
    recentUpdates: [
      { date: "2023-06-15", update: "Completed homepage design" },
      { date: "2023-06-10", update: "Started work on product pages" },
      { date: "2023-06-05", update: "Finalized color scheme" },
    ]
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{project.name}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-semibold">Status: {project.status}</p>
            <p><FaCalendar className="inline mr-2" /> Start Date: {project.startDate}</p>
            <p><FaCalendar className="inline mr-2" /> Due Date: {project.dueDate}</p>
          </div>
          <div>
            <p><FaCheckCircle className="inline mr-2 text-green-500" /> {project.completedTasks} completed</p>
            <p><FaClock className="inline mr-2 text-yellow-500" /> {project.inProgressTasks} in progress</p>
            <p><FaExclamationTriangle className="inline mr-2 text-red-500" /> {project.blockedTasks} blocked</p>
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Team Members</h2>
          <div className="flex space-x-2">
            {project.teamMembers.map((member, index) => (
              <div key={index} className="bg-blue-100 dark:bg-blue-800 rounded-full px-3 py-1">
                <FaUser className="inline mr-2" /> {member}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Recent Updates</h2>
          <ul className="space-y-2">
            {project.recentUpdates.map((update, index) => (
              <li key={index} className="border-b pb-2">
                <span className="font-semibold">{update.date}:</span> {update.update}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
