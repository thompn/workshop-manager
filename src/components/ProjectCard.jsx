import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaEdit, FaTrash } from 'react-icons/fa';
import { updateProject, deleteProject } from '../firebaseOperations';

const ProjectCard = ({ project, onProjectsChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);

  const handleEdit = async () => {
    try {
      await updateProject(project.id, editedProject);
      setIsEditing(false);
      onProjectsChange();
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(project.id);
        onProjectsChange();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <input
          type="text"
          value={editedProject.name}
          onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <textarea
          value={editedProject.description}
          onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
          rows="3"
        ></textarea>
        <div className="flex justify-end">
          <button onClick={() => setIsEditing(false)} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleEdit} className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{project.name}</h3>
        <div>
          <button onClick={() => setIsEditing(true)} className="text-yellow-500 hover:text-yellow-600 mr-2">
            <FaEdit />
          </button>
          <button onClick={handleDelete} className="text-red-500 hover:text-red-600">
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">{project.description}</p>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <span className="text-sm font-medium mb-2 sm:mb-0 text-gray-700 dark:text-gray-200">{project.status}</span>
        <div className="flex space-x-2 text-sm">
          <span><FaCheckCircle className="inline mr-1 text-green-500" /> {project.completedTasks}</span>
          <span><FaClock className="inline mr-1 text-yellow-500" /> {project.inProgressTasks}</span>
          <span><FaExclamationTriangle className="inline mr-1 text-red-500" /> {project.blockedTasks}</span>
        </div>
      </div>
      <Link to={`/projects/${project.id}`} className="mt-4 inline-block text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
        View Details
      </Link>
    </div>
  );
};

export default ProjectCard;
