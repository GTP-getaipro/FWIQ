import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook for keyboard navigation accessibility
 * Provides utilities for managing keyboard navigation patterns
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEnter = null,
    onEscape = null,
    onArrowUp = null,
    onArrowDown = null,
    onArrowLeft = null,
    onArrowRight = null,
    onTab = null,
    onShiftTab = null,
    trapFocus = false,
    autoFocus = false
  } = options;

  const containerRef = useRef(null);
  const focusableElementsRef = useRef([]);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(containerRef.current.querySelectorAll(selector));
  }, []);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    
    if (elements[nextIndex]) {
      elements[nextIndex].focus();
    }
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement);
    const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    
    if (elements[prevIndex]) {
      elements[prevIndex].focus();
    }
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements[0]) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements[elements.length - 1]) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event) => {
    const { key, shiftKey } = event;

    switch (key) {
      case 'Enter':
        if (onEnter) {
          onEnter(event);
        }
        break;
        
      case 'Escape':
        if (onEscape) {
          onEscape(event);
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (onArrowUp) {
          onArrowUp(event);
        }
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (onArrowDown) {
          onArrowDown(event);
        }
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        if (onArrowLeft) {
          onArrowLeft(event);
        }
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        if (onArrowRight) {
          onArrowRight(event);
        }
        break;
        
      case 'Tab':
        if (trapFocus && containerRef.current) {
          const elements = getFocusableElements();
          const firstElement = elements[0];
          const lastElement = elements[elements.length - 1];
          
          if (shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              event.preventDefault();
            }
            if (onShiftTab) {
              onShiftTab(event);
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              event.preventDefault();
            }
            if (onTab) {
              onTab(event);
            }
          }
        } else {
          if (shiftKey && onShiftTab) {
            onShiftTab(event);
          } else if (onTab) {
            onTab(event);
          }
        }
        break;
        
      case 'Home':
        event.preventDefault();
        focusFirst();
        break;
        
      case 'End':
        event.preventDefault();
        focusLast();
        break;
    }
  }, [
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    trapFocus,
    getFocusableElements,
    focusFirst,
    focusLast
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    if (autoFocus) {
      const elements = getFocusableElements();
      if (elements[0]) {
        elements[0].focus();
      }
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, autoFocus, getFocusableElements]);

  return {
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements
  };
};

/**
 * Hook for managing focus trap in modals and dialogs
 */
export const useFocusTrap = (isActive = false) => {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for managing ARIA attributes dynamically
 */
export const useAriaAttributes = (initialAttributes = {}) => {
  const [attributes, setAttributes] = useState(initialAttributes);
  const elementRef = useRef(null);

  const updateAttribute = useCallback((name, value) => {
    setAttributes(prev => ({
      ...prev,
      [name]: value
    }));

    if (elementRef.current) {
      if (value === null || value === undefined) {
        elementRef.current.removeAttribute(name);
      } else {
        elementRef.current.setAttribute(name, value);
      }
    }
  }, []);

  const setAriaExpanded = useCallback((expanded) => {
    updateAttribute('aria-expanded', expanded);
  }, [updateAttribute]);

  const setAriaSelected = useCallback((selected) => {
    updateAttribute('aria-selected', selected);
  }, [updateAttribute]);

  const setAriaChecked = useCallback((checked) => {
    updateAttribute('aria-checked', checked);
  }, [updateAttribute]);

  const setAriaPressed = useCallback((pressed) => {
    updateAttribute('aria-pressed', pressed);
  }, [updateAttribute]);

  const setAriaLabel = useCallback((label) => {
    updateAttribute('aria-label', label);
  }, [updateAttribute]);

  const setAriaDescribedBy = useCallback((descriptionId) => {
    updateAttribute('aria-describedby', descriptionId);
  }, [updateAttribute]);

  useEffect(() => {
    if (!elementRef.current) return;

    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== null && value !== undefined) {
        elementRef.current.setAttribute(name, value);
      }
    });
  }, [attributes]);

  return {
    elementRef,
    attributes,
    updateAttribute,
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    setAriaPressed,
    setAriaLabel,
    setAriaDescribedBy
  };
};
