// src/components/Header.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';

const Header = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:text-blue-500 dark:hover:text-blue-400">Home</Link></li>
              <li><Link to="/projects" className="hover:text-blue-500 dark:hover:text-blue-400">Projects</Link></li>
              <li><Link to="/vehicles" className="hover:text-blue-500 dark:hover:text-blue-400">Vehicles</Link></li>
              <li><Link to="/parts" className="hover:text-blue-500 dark:hover:text-blue-400">Parts</Link></li>
              <li><Link to="/tools" className="hover:text-blue-500 dark:hover:text-blue-400">Tools</Link></li>
            </ul>
          </nav>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;