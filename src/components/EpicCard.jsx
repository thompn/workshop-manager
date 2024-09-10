import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';
import AddStoryModal from './AddStoryModal';

const EpicCard = ({ epic, onUpdateEpic, onDeleteEpic, onAddStory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEpic, setEditedEpic] = useState(epic);
  const [isAddingStory, setIsAddingStory] = useState(false);

  const handleEdit = () => {
    onUpdateEpic(epic.id, editedEpic);
    setIsEditing(false);
  };

  const handleAddStory = (storyData) => {
    onAddStory(epic.id, storyData);
    setIsAddingStory(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <input
          type="text"
          value={editedEpic.name}
          onChange={(e) => setEditedEpic({ ...editedEpic, name: e.target.value })}
          className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <textarea
          value={editedEpic.description}
          onChange={(e) => setEditedEpic({ ...editedEpic, description: e.target.value })}
          className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
          rows="3"
        ></textarea>
        <div className="flex justify-end">
          <button onClick={() => setIsEditing(false)} className="mr-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancel</button>
          <button onClick={handleEdit} className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{epic.name}</h3>
        <div>
          <button onClick={() => setIsEditing(true)} className="text-yellow-500 hover:text-yellow-600 mr-2">
            <FaEdit />
          </button>
          <button onClick={() => onDeleteEpic(epic.id)} className="text-red-500 hover:text-red-600">
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{epic.description}</p>
      <div className="flex justify-between items-center">
        <Link to={`/projects/${epic.projectId}/epics/${epic.id}`} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
          View Stories
        </Link>
        <button
          onClick={() => setIsAddingStory(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm"
        >
          Add Story
        </button>
      </div>
      <AddStoryModal
        isOpen={isAddingStory}
        onClose={() => setIsAddingStory(false)}
        onAddStory={handleAddStory}
      />
    </div>
  );
};

export default EpicCard;