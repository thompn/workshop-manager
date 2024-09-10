import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEpicStories, addStory, updateStory, deleteStory, getEpicDetails } from '../firebaseOperations';
import StoryList from '../components/StoryList';
import AddStoryModal from '../components/AddStoryModal';

const EpicDetails = () => {
  const { projectId, epicId } = useParams();
  console.log("projectId:", projectId);
  console.log("epicId:", epicId);

  const [stories, setStories] = useState([]);
  const [epicName, setEpicName] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect triggered");
    fetchEpicDetails();
    fetchStories();
  }, [projectId, epicId]);

  const fetchEpicDetails = async () => {
    try {
      const epicDetails = await getEpicDetails(projectId, epicId);
      setEpicName(epicDetails.name);
    } catch (error) {
      console.error("Error fetching epic details:", error);
    }
  };

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const storyList = await getEpicStories(projectId, epicId);
      setStories(storyList);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStory = async (storyData) => {
    try {
      await addStory(projectId, epicId, storyData);
      fetchStories();
    } catch (error) {
      console.error("Error adding story:", error);
    }
  };

  const handleUpdateStory = async (storyId, storyData) => {
    try {
      await updateStory(projectId, epicId, storyId, storyData);
      fetchStories();
    } catch (error) {
      console.error("Error updating story:", error);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await deleteStory(projectId, epicId, storyId);
      fetchStories();
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-white">
      {projectId && epicId ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Epic: {epicName}</h1>
            <Link to={`/projects/${projectId}`} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
              Back to Project
            </Link>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Add Story
          </button>
          {isLoading ? (
            <p>Loading stories...</p>
          ) : (
            <StoryList
              stories={stories}
              onUpdateStory={handleUpdateStory}
              onDeleteStory={handleDeleteStory}
            />
          )}
          <AddStoryModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddStory={handleAddStory}
          />
        </>
      ) : (
        <p>Error: Invalid project or epic ID</p>
      )}
    </div>
  );
};

export default EpicDetails;