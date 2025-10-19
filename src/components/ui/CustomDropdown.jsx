import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  icon: Icon = null,
  className = "",
  disabled = false,
  id = null,
  name = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(option => option.value === value) || options[0]
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  // Update selected option when value prop changes
  useEffect(() => {
    const newSelectedOption = options.find(option => option.value === value);
    if (newSelectedOption) {
      setSelectedOption(newSelectedOption);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.custom-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative custom-dropdown ${className}`}>
      <button
        id={id}
        name={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-h-[40px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className="flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                  option.value === value
                    ? 'bg-blue-50 dark:bg-blue-800/60 text-blue-700 dark:text-blue-100 font-medium'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === options.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                <div className="flex items-center">
                  {Icon && <Icon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-400" />}
                  {option.label}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;
