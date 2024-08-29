import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const ProjectCard = ({ project }) => {
  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{project.status}</span>
          <div className="flex space-x-2">
            <span><FaCheckCircle className="inline mr-1 text-green-500" /> {project.completedTasks}</span>
            <span><FaClock className="inline mr-1 text-yellow-500" /> {project.inProgressTasks}</span>
            <span><FaExclamationTriangle className="inline mr-1 text-red-500" /> {project.blockedTasks}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
