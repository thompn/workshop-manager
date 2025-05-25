import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Header = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        if (!event.target.closest('#mobile-menu-button')) {
            setIsMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuRef]);

  const navLinks = (
    <>
      <Link to="/todo" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>To-Do</Link>
      <Link to="/vehicles" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Vehicles</Link>
      <Link to="/parts" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Parts</Link>
      <Link to="/tools" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Tools</Link>
      <Link to="/suppliers" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Suppliers</Link>
      <Link to="/locations" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Locations</Link>
      <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
      <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-700 md:ml-4 md:bg-red-500 md:hover:bg-red-600 md:text-white md:font-bold md:py-2 md:px-4 md:rounded md:w-auto">
        Logout
      </button>
    </>
  );

  const authLinks = (
    <>
      <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
      <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 md:mx-2 md:text-sm" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
    </>
  )

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-xl font-semibold text-gray-700 dark:text-white">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Workshop Management</Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex md:ml-6 md:items-center">
              {currentUser ? navLinks : authLinks}
            </div>
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
            <div className="md:hidden ml-2 flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                id="mobile-menu-button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <FaBars className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 transform shadow-lg" id="mobile-menu" ref={mobileMenuRef}>
          <div className="pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
            {currentUser ? navLinks : authLinks}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;