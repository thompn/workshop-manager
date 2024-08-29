import React from 'react';
import { FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{project.name}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">Status: {project.status}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Due: {project.dueDate}</p>
      </div>
    </div>
    <div className="flex justify-between items-center mt-4">
      <div>
        <p className="text-sm"><FaCheckCircle className="inline mr-2 text-green-500" /> {project.completedTasks} completed</p>
        <p className="text-sm"><FaClock className="inline mr-2 text-yellow-500" /> {project.inProgressTasks} in progress</p>
        <p className="text-sm"><FaExclamationTriangle className="inline mr-2 text-red-500" /> {project.blockedTasks} blocked</p>
      </div>
      <Link to={`/projects/${project.id}`} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        View Details
      </Link>
    </div>
  </div>
);

const Projects = () => {
  // Mock data - replace with actual data from Jira API later
  const projects = [
    {
      id: 1,
      name: "Website Redesign",
      description: "Overhaul the company website with a modern, responsive design",
      status: "In Progress",
      dueDate: "2023-08-31",
      completedTasks: 15,
      inProgressTasks: 8,
      blockedTasks: 2
    },
    {
      id: 2,
      name: "Mobile App Development",
      description: "Create a cross-platform mobile app for our services",
      status: "Planning",
      dueDate: "2023-12-15",
      completedTasks: 3,
      inProgressTasks: 5,
      blockedTasks: 0
    },
    {
      id: 3,
      name: "Data Migration",
      description: "Migrate data from legacy systems to new cloud-based solution",
      status: "On Hold",
      dueDate: "2023-10-01",
      completedTasks: 7,
      inProgressTasks: 2,
      blockedTasks: 4
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link to="/projects/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Projects
        </Link>
      </div>
      <div className="space-y-6">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Projects;

