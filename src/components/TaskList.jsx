import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TaskList = ({ tasks, onUpdateTask, onDeleteTask }) => {
  const [editingTask, setEditingTask] = useState(null);

  const handleEditSubmit = (taskId, updatedTask) => {
    onUpdateTask(taskId, updatedTask);
    setEditingTask(null);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          {editingTask === task.id ? (
            <EditTaskForm
              task={task}
              onSubmit={(updatedTask) => handleEditSubmit(task.id, updatedTask)}
              onCancel={() => setEditingTask(null)}
            />
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
                <span className="text-sm text-gray-500 dark:text-gray-300">Status: {task.status}</span>
              </div>
              <div>
                <button
                  onClick={() => setEditingTask(task.id)}
                  className="text-yellow-500 hover:text-yellow-600 mr-2"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const EditTaskForm = ({ task, onSubmit, onCancel }) => {
  const [editedTask, setEditedTask] = useState(task);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(editedTask);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={editedTask.title}
        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        value={editedTask.description}
        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
        className="w-full p-2 border rounded"
        rows="3"
      ></textarea>
      <select
        value={editedTask.status}
        onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
        className="w-full p-2 border rounded"
      >
        <option value="To Do">To Do</option>
        <option value="In Progress">In Progress</option>
        <option value="Done">Done</option>
      </select>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Save
        </button>
      </div>
    </form>
  );
};

export default TaskList;