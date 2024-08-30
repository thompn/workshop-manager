import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, orderBy('lastWorked', 'desc'), limit(4));
        const querySnapshot = await getDocs(q);
        const projectList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-xl font-semibold">{project.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last Worked: {format(new Date(project.lastWorked.toDate()), 'yyyy-MM-dd')}
            </p>
            <p className="mt-2">{project.lastCompletedStep}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;