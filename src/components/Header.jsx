import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Header = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold text-gray-700 dark:text-white">
            <Link to="/">Workshop Management System</Link>
          </div>
          <div className="flex items-center">
            {currentUser ? (
              <>
                <Link to="/projects" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Projects</Link>
                <Link to="/vehicles" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Vehicles</Link>
                <Link to="/parts" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Parts</Link>
                <Link to="/tools" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Tools</Link>
                <Link to="/profile" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Profile</Link>
                <button onClick={handleLogout} className="ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Login</Link>
                <Link to="/register" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Register</Link>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="ml-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;