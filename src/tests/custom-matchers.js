/**
 * Custom Jest Matchers for FloWorx Testing
 * Additional matchers for better test assertions
 */

// Custom matcher for checking if element has specific CSS class
expect.extend({
  toHaveClass: (received, className) => {
    const pass = received.classList.contains(className);
    if (pass) {
      return {
        message: () => `expected element not to have class "${className}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have class "${className}"`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is visible
  toBeVisible: (received) => {
    const pass = received.offsetParent !== null && received.offsetWidth > 0 && received.offsetHeight > 0;
    if (pass) {
      return {
        message: () => `expected element not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is hidden
  toBeHidden: (received) => {
    const pass = received.offsetParent === null || received.offsetWidth === 0 || received.offsetHeight === 0;
    if (pass) {
      return {
        message: () => `expected element not to be hidden`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be hidden`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element has specific attribute
  toHaveAttribute: (received, attribute, value) => {
    const hasAttribute = received.hasAttribute(attribute);
    if (value !== undefined) {
      const attributeValue = received.getAttribute(attribute);
      const pass = hasAttribute && attributeValue === value;
      if (pass) {
        return {
          message: () => `expected element not to have attribute "${attribute}" with value "${value}"`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected element to have attribute "${attribute}" with value "${value}"`,
          pass: false,
        };
      }
    } else {
      if (hasAttribute) {
        return {
          message: () => `expected element not to have attribute "${attribute}"`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected element to have attribute "${attribute}"`,
          pass: false,
        };
      }
    }
  },

  // Custom matcher for checking if element has specific data attribute
  toHaveDataAttribute: (received, attribute, value) => {
    const dataAttribute = `data-${attribute}`;
    return expect.extend({}).toHaveAttribute(received, dataAttribute, value);
  },

  // Custom matcher for checking if element is focused
  toBeFocused: (received) => {
    const pass = received === document.activeElement;
    if (pass) {
      return {
        message: () => `expected element not to be focused`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be focused`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is disabled
  toBeDisabled: (received) => {
    const pass = received.disabled === true;
    if (pass) {
      return {
        message: () => `expected element not to be disabled`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be disabled`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is enabled
  toBeEnabled: (received) => {
    const pass = received.disabled === false;
    if (pass) {
      return {
        message: () => `expected element not to be enabled`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be enabled`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is required
  toBeRequired: (received) => {
    const pass = received.required === true;
    if (pass) {
      return {
        message: () => `expected element not to be required`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be required`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is valid
  toBeValid: (received) => {
    const pass = received.validity.valid === true;
    if (pass) {
      return {
        message: () => `expected element not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be valid`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is invalid
  toBeInvalid: (received) => {
    const pass = received.validity.valid === false;
    if (pass) {
      return {
        message: () => `expected element not to be invalid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be invalid`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element has specific value
  toHaveValue: (received, value) => {
    const pass = received.value === value;
    if (pass) {
      return {
        message: () => `expected element not to have value "${value}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have value "${value}"`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element has specific text content
  toHaveTextContent: (received, text) => {
    const pass = received.textContent.includes(text);
    if (pass) {
      return {
        message: () => `expected element not to have text content "${text}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have text content "${text}"`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element has specific inner HTML
  toHaveInnerHTML: (received, html) => {
    const pass = received.innerHTML.includes(html);
    if (pass) {
      return {
        message: () => `expected element not to have inner HTML "${html}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have inner HTML "${html}"`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is in viewport
  toBeInViewport: (received) => {
    const rect = received.getBoundingClientRect();
    const pass = rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
    if (pass) {
      return {
        message: () => `expected element not to be in viewport`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be in viewport`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element is scrollable
  toBeScrollable: (received) => {
    const pass = received.scrollHeight > received.clientHeight || received.scrollWidth > received.clientWidth;
    if (pass) {
      return {
        message: () => `expected element not to be scrollable`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be scrollable`,
        pass: false,
      };
    }
  },

  // Custom matcher for checking if element has specific style
  toHaveStyle: (received, style) => {
    const pass = Object.keys(style).every(property => {
      const expectedValue = style[property];
      const actualValue = window.getComputedStyle(received)[property];
      return actualValue === expectedValue;
    });
    if (pass) {
      return {
        message: () => `expected element not to have style ${JSON.stringify(style)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have style ${JSON.stringify(style)}`,
        pass: false,
      };
    }
  }
});

// Export custom matchers
export default expect;
