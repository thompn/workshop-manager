import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import ProjectCard from '../components/ProjectCard';

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectList);
    };

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Projects</h1>
        <Link
          to="/projects/manage"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
        >
          Manage Projects
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Projects;

