/**
 * Accessibility Manager
 * Provides utilities for accessibility compliance and screen reader support
 */

export class A11yManager {
  static announceMessage(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  static validateForm(formElement) {
    const errors = [];
    const inputs = formElement.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        errors.push({
          field: input.name,
          message: `${input.name} is required`
        });
        
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${input.name}-error`);
      } else {
        input.setAttribute('aria-invalid', 'false');
        input.removeAttribute('aria-describedby');
      }
    });
    
    return errors;
  }

  static setAriaExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  static setAriaSelected(element, selected) {
    element.setAttribute('aria-selected', selected.toString());
  }

  static setAriaChecked(element, checked) {
    element.setAttribute('aria-checked', checked.toString());
  }

  static setAriaPressed(element, pressed) {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  static setAriaDisabled(element, disabled) {
    element.setAttribute('aria-disabled', disabled.toString());
  }

  static addAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
  }

  static addAriaDescribedBy(element, descriptionId) {
    const existing = element.getAttribute('aria-describedby');
    if (existing) {
      element.setAttribute('aria-describedby', `${existing} ${descriptionId}`);
    } else {
      element.setAttribute('aria-describedby', descriptionId);
    }
  }

  static createScreenReaderOnly(text) {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = text;
    return element;
  }

  static setupSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  static setupFocusVisible() {
    // Add focus-visible class for better keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  static validateColorContrast(foreground, background) {
    // Simple contrast ratio calculation
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(c => {
        c = parseInt(c) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const foregroundLuminance = getLuminance(foreground);
    const backgroundLuminance = getLuminance(background);
    
    const contrast = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / 
                    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    
    return {
      ratio: contrast,
      level: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Fail'
    };
  }

  static setupGlobalA11y() {
    // Set up global accessibility features
    this.setupSkipLinks();
    this.setupFocusVisible();
    
    // Add CSS for screen reader only content
    if (!document.querySelector('#a11y-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-styles';
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .focus\\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
        
        .keyboard-navigation *:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
