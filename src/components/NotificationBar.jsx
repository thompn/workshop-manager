import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const NotificationBar = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) {
          onClose();
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onClose]);

  if (!visible || !message) {
    return null;
  }

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const Icon = isSuccess ? FaCheckCircle : FaExclamationCircle;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 p-4 text-white ${bgColor} shadow-lg transition-transform duration-300 ease-in-out transform ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon className="mr-3 text-xl" />
        <span>{message}</span>
      </div>
      <button 
        onClick={() => {
          setVisible(false);
          if (onClose) {
            onClose();
          }
        }} 
        className="text-white hover:text-gray-200"
      >
        <FaTimes className="text-xl" />
      </button>
    </div>
  );
};

export default NotificationBar; 