import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: '',
    dueDate: '',
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projectList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProjects(projectList);
  };

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleAddProject = async () => {
    try {
      await addDoc(collection(db, "projects"), newProject);
      setNewProject({
        name: '',
        description: '',
        status: '',
        dueDate: '',
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0
      });
      fetchProjects();
    } catch (error) {
      console.error("Error adding project: ", error);
    }
  };

  const handleEditProject = async (id, updatedProject) => {
    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, updatedProject);
      fetchProjects();
    } catch (error) {
      console.error("Error updating project: ", error);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteDoc(doc(db, "projects", id));
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project: ", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Projects</h1>
        <Link to="/projects" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Projects
        </Link>
      </div>

      {/* Form to add new project */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add New Project</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newProject.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={newProject.description}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          {/* Add more input fields for other project properties */}
        </div>
        <button
          onClick={handleAddProject}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Project
        </button>
      </div>

      {/* List of existing projects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Projects</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b dark:border-gray-700">
                <td className="p-2">{project.name}</td>
                <td className="p-2">{project.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEditProject(project.id, { ...project, name: 'Edited ' + project.name })}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageProjects;
