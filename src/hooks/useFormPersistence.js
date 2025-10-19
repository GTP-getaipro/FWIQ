import { useEffect } from 'react';

export const useFormPersistence = (key, values) => {
  // Save form data to localStorage whenever values change
  useEffect(() => {
    if (values && Object.keys(values).length > 0) {
      const hasNonEmptyValues = Object.values(values).some(value => 
        value && value.toString().trim() !== ''
      );
      
      if (hasNonEmptyValues) {
        localStorage.setItem(key, JSON.stringify(values));
      }
    }
  }, [key, values]);

  // Load form data from localStorage on mount
  const loadPersistedData = () => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading persisted form data:', error);
      return null;
    }
  };

  // Clear persisted data
  const clearPersistedData = () => {
    localStorage.removeItem(key);
  };

  return {
    loadPersistedData,
    clearPersistedData
  };
};