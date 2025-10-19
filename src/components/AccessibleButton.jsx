import React, { forwardRef } from 'react';
import { useKeyboardNavigation, useAriaAttributes } from '@/hooks/useKeyboardNavigation';
import { A11yManager } from '@/lib/a11y';

/**
 * AccessibleButton component with built-in accessibility features
 * Extends the base Button component with enhanced accessibility
 */
const AccessibleButton = forwardRef(({
  children,
  onClick,
  disabled = false,
  loading = false,
  pressed = false,
  expanded = null,
  describedBy = null,
  ariaLabel = null,
  onKeyDown = null,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}, ref) => {
  const { setAriaPressed, setAriaExpanded, setAriaDescribedBy, setAriaLabel } = useAriaAttributes({
    'aria-pressed': pressed,
    'aria-expanded': expanded,
    'aria-describedby': describedBy,
    'aria-label': ariaLabel,
    'aria-disabled': disabled || loading
  });

  const { containerRef } = useKeyboardNavigation({
    onEnter: (event) => {
      if (!disabled && !loading && onClick) {
        onClick(event);
        A11yManager.announceMessage(`Button activated: ${ariaLabel || children}`);
      }
    },
    onKeyDown: (event) => {
      if (onKeyDown) {
        onKeyDown(event);
      }
    }
  });

  const handleClick = (event) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
      A11yManager.announceMessage(`Button activated: ${ariaLabel || children}`);
    }
  };

  const handleMouseDown = () => {
    setAriaPressed(true);
  };

  const handleMouseUp = () => {
    setAriaPressed(false);
  };

  const buttonClasses = `
    inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors 
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
    disabled:pointer-events-none disabled:opacity-50
    ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
    ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
    ${variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' : ''}
    ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
    ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
    ${variant === 'link' ? 'text-primary underline-offset-4 hover:underline' : ''}
    ${size === 'default' ? 'h-10 px-4 py-2' : ''}
    ${size === 'sm' ? 'h-9 rounded-md px-3' : ''}
    ${size === 'lg' ? 'h-11 rounded-md px-8' : ''}
    ${size === 'icon' ? 'h-10 w-10' : ''}
    ${className}
  `.trim();

  return (
    <button
      ref={ref}
      className={buttonClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled || loading}
      type="button"
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {loading && (
        <span className="sr-only">Loading</span>
      )}
      {children}
      {ariaLabel && (
        <span className="sr-only">{ariaLabel}</span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * AccessibleToggleButton component for toggle functionality
 */
export const AccessibleToggleButton = forwardRef(({
  children,
  pressed = false,
  onToggle,
  ariaLabel,
  ...props
}, ref) => {
  const { setAriaPressed } = useAriaAttributes({
    'aria-pressed': pressed
  });

  const handleToggle = (event) => {
    const newPressed = !pressed;
    setAriaPressed(newPressed);
    onToggle?.(newPressed, event);
    A11yManager.announceMessage(
      `${ariaLabel || children} ${newPressed ? 'pressed' : 'unpressed'}`
    );
  };

  return (
    <AccessibleButton
      ref={ref}
      onClick={handleToggle}
      pressed={pressed}
      ariaLabel={ariaLabel}
      {...props}
    >
      {children}
    </AccessibleButton>
  );
});

AccessibleToggleButton.displayName = 'AccessibleToggleButton';

/**
 * AccessibleIconButton component for icon-only buttons
 */
export const AccessibleIconButton = forwardRef(({
  children,
  ariaLabel,
  icon,
  ...props
}, ref) => {
  return (
    <AccessibleButton
      ref={ref}
      ariaLabel={ariaLabel}
      size="icon"
      className="rounded-full"
      {...props}
    >
      {icon}
      <span className="sr-only">{ariaLabel}</span>
    </AccessibleButton>
  );
});

AccessibleIconButton.displayName = 'AccessibleIconButton';

/**
 * AccessibleLinkButton component that behaves like a link but with button semantics
 */
export const AccessibleLinkButton = forwardRef(({
  children,
  href,
  ariaLabel,
  ...props
}, ref) => {
  const handleClick = (event) => {
    if (href) {
      window.location.href = href;
    }
    A11yManager.announceMessage(`Link activated: ${ariaLabel || children}`);
  };

  return (
    <AccessibleButton
      ref={ref}
      onClick={handleClick}
      ariaLabel={ariaLabel}
      role="link"
      {...props}
    >
      {children}
    </AccessibleButton>
  );
});

AccessibleLinkButton.displayName = 'AccessibleLinkButton';

export default AccessibleButton;
