import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectEpics, addEpic, updateEpic, deleteEpic, addStory } from '../firebaseOperations';
import EpicList from '../components/EpicList';
import AddEpicModal from '../components/AddEpicModal';

const ProjectDetails = () => {
  const { id } = useParams();
  const [epics, setEpics] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchEpics();
  }, [id]);

  const fetchEpics = async () => {
    try {
      const epicList = await getProjectEpics(id);
      setEpics(epicList);
    } catch (error) {
      console.error("Error fetching epics:", error);
    }
  };

  const handleAddEpic = async (epicData) => {
    try {
      await addEpic(id, epicData);
      fetchEpics();
    } catch (error) {
      console.error("Error adding epic:", error);
    }
  };

  const handleUpdateEpic = async (epicId, epicData) => {
    try {
      await updateEpic(id, epicId, epicData);
      fetchEpics();
    } catch (error) {
      console.error("Error updating epic:", error);
    }
  };

  const handleDeleteEpic = async (epicId) => {
    try {
      await deleteEpic(id, epicId);
      fetchEpics();
    } catch (error) {
      console.error("Error deleting epic:", error);
    }
  };

  const handleAddStory = async (epicId, storyData) => {
    try {
      await addStory(id, epicId, storyData);
      fetchEpics();
    } catch (error) {
      console.error("Error adding story:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Project Details</h1>
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
      >
        Add Epic
      </button>
      <EpicList
        epics={epics}
        onUpdateEpic={handleUpdateEpic}
        onDeleteEpic={handleDeleteEpic}
        onAddStory={handleAddStory}
      />
      <AddEpicModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEpic={handleAddEpic}
      />
    </div>
  );
};

export default ProjectDetails;
