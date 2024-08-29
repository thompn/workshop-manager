// src/components/ProjectList.jsx
import React from 'react';
import { format } from 'date-fns';

const ProjectList = () => {
  // TODO: Replace with actual project data from backend
  const projects = [
    { id: 1, name: 'Project A', lastWorked: new Date(2023, 3, 15), lastCompletedStep: 'Design phase completed' },
    { id: 2, name: 'Project B', lastWorked: new Date(2023, 3, 10), lastCompletedStep: 'Initial setup' },
    { id: 3, name: 'Project C', lastWorked: new Date(2023, 3, 5), lastCompletedStep: 'Requirements gathering' },
    { id: 4, name: 'Project D', lastWorked: new Date(2023, 2, 28), lastCompletedStep: 'Project kickoff' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-xl font-semibold">{project.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last Worked: {format(project.lastWorked, 'yyyy-MM-dd')}
            </p>
            <p className="mt-2">{project.lastCompletedStep}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;