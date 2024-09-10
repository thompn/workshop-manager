import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const StoryCard = ({ story, onUpdateStory, onDeleteStory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState(story);

  const handleEdit = () => {
    onUpdateStory(story.id, editedStory);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <input
          type="text"
          value={editedStory.name}
          onChange={(e) => setEditedStory({ ...editedStory, name: e.target.value })}
          className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <textarea
          value={editedStory.description}
          onChange={(e) => setEditedStory({ ...editedStory, description: e.target.value })}
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{story.name}</h3>
        <div>
          <button onClick={() => setIsEditing(true)} className="text-yellow-500 hover:text-yellow-600 mr-2">
            <FaEdit />
          </button>
          <button onClick={() => onDeleteStory(story.id)} className="text-red-500 hover:text-red-600">
            <FaTrash />
          </button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{story.description}</p>
    </div>
  );
};

export default StoryCard;