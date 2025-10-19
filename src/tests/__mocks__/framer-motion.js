/**
 * Framer Motion Mock for Testing
 * Mock implementation for Framer Motion components and hooks
 */

import React from 'react';

// Mock motion components
export const motion = {
  div: React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="motion-div" {...props}>
      {children}
    </div>
  )),
  span: React.forwardRef(({ children, ...props }, ref) => (
    <span ref={ref} data-testid="motion-span" {...props}>
      {children}
    </span>
  )),
  button: React.forwardRef(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="motion-button" {...props}>
      {children}
    </button>
  )),
  h1: React.forwardRef(({ children, ...props }, ref) => (
    <h1 ref={ref} data-testid="motion-h1" {...props}>
      {children}
    </h1>
  )),
  h2: React.forwardRef(({ children, ...props }, ref) => (
    <h2 ref={ref} data-testid="motion-h2" {...props}>
      {children}
    </h2>
  )),
  h3: React.forwardRef(({ children, ...props }, ref) => (
    <h3 ref={ref} data-testid="motion-h3" {...props}>
      {children}
    </h3>
  )),
  p: React.forwardRef(({ children, ...props }, ref) => (
    <p ref={ref} data-testid="motion-p" {...props}>
      {children}
    </p>
  )),
  section: React.forwardRef(({ children, ...props }, ref) => (
    <section ref={ref} data-testid="motion-section" {...props}>
      {children}
    </section>
  )),
  article: React.forwardRef(({ children, ...props }, ref) => (
    <article ref={ref} data-testid="motion-article" {...props}>
      {children}
    </article>
  )),
  header: React.forwardRef(({ children, ...props }, ref) => (
    <header ref={ref} data-testid="motion-header" {...props}>
      {children}
    </header>
  )),
  footer: React.forwardRef(({ children, ...props }, ref) => (
    <footer ref={ref} data-testid="motion-footer" {...props}>
      {children}
    </footer>
  )),
  nav: React.forwardRef(({ children, ...props }, ref) => (
    <nav ref={ref} data-testid="motion-nav" {...props}>
      {children}
    </nav>
  )),
  main: React.forwardRef(({ children, ...props }, ref) => (
    <main ref={ref} data-testid="motion-main" {...props}>
      {children}
    </main>
  )),
  aside: React.forwardRef(({ children, ...props }, ref) => (
    <aside ref={ref} data-testid="motion-aside" {...props}>
      {children}
    </aside>
  )),
  form: React.forwardRef(({ children, ...props }, ref) => (
    <form ref={ref} data-testid="motion-form" {...props}>
      {children}
    </form>
  )),
  input: React.forwardRef(({ children, ...props }, ref) => (
    <input ref={ref} data-testid="motion-input" {...props}>
      {children}
    </input>
  )),
  textarea: React.forwardRef(({ children, ...props }, ref) => (
    <textarea ref={ref} data-testid="motion-textarea" {...props}>
      {children}
    </textarea>
  )),
  select: React.forwardRef(({ children, ...props }, ref) => (
    <select ref={ref} data-testid="motion-select" {...props}>
      {children}
    </select>
  )),
  option: React.forwardRef(({ children, ...props }, ref) => (
    <option ref={ref} data-testid="motion-option" {...props}>
      {children}
    </option>
  )),
  ul: React.forwardRef(({ children, ...props }, ref) => (
    <ul ref={ref} data-testid="motion-ul" {...props}>
      {children}
    </ul>
  )),
  ol: React.forwardRef(({ children, ...props }, ref) => (
    <ol ref={ref} data-testid="motion-ol" {...props}>
      {children}
    </ol>
  )),
  li: React.forwardRef(({ children, ...props }, ref) => (
    <li ref={ref} data-testid="motion-li" {...props}>
      {children}
    </li>
  )),
  img: React.forwardRef(({ children, ...props }, ref) => (
    <img ref={ref} data-testid="motion-img" {...props}>
      {children}
    </img>
  )),
  a: React.forwardRef(({ children, ...props }, ref) => (
    <a ref={ref} data-testid="motion-a" {...props}>
      {children}
    </a>
  ))
};

// Mock AnimatePresence component
export const AnimatePresence = ({ children }) => (
  <div data-testid="animate-presence">
    {children}
  </div>
);

// Mock useAnimation hook
export const useAnimation = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn(),
  isAnimating: false
}));

// Mock useMotionValue hook
export const useMotionValue = jest.fn((initial) => ({
  get: jest.fn(() => initial),
  set: jest.fn(),
  onChange: jest.fn()
}));

// Mock useTransform hook
export const useTransform = jest.fn((value, inputRange, outputRange) => ({
  get: jest.fn(() => outputRange[0]),
  set: jest.fn(),
  onChange: jest.fn()
}));

// Mock useSpring hook
export const useSpring = jest.fn((value, config) => ({
  get: jest.fn(() => value),
  set: jest.fn(),
  onChange: jest.fn()
}));

// Mock useViewportScroll hook
export const useViewportScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useElementScroll hook
export const useElementScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useTransform hook
export const useTransform = jest.fn((value, inputRange, outputRange) => ({
  get: jest.fn(() => outputRange[0]),
  set: jest.fn(),
  onChange: jest.fn()
}));

// Mock useCycle hook
export const useCycle = jest.fn((...items) => [
  items[0],
  jest.fn()
]);

// Mock useReducedMotion hook
export const useReducedMotion = jest.fn(() => false);

// Mock usePresence hook
export const usePresence = jest.fn(() => [true, jest.fn()]);

// Mock useDragControls hook
export const useDragControls = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  drag: jest.fn()
}));

// Mock useGesture hook
export const useGesture = jest.fn(() => ({}));

// Mock useInView hook
export const useInView = jest.fn(() => [false, jest.fn()]);

// Mock useMotionValueEvent hook
export const useMotionValueEvent = jest.fn();

// Mock useScroll hook
export const useScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useVelocity hook
export const useVelocity = jest.fn(() => ({
  get: jest.fn(() => 0),
  onChange: jest.fn()
}));

// Mock useWillChange hook
export const useWillChange = jest.fn(() => false);

// Mock useElementSize hook
export const useElementSize = jest.fn(() => ({
  width: { get: jest.fn(() => 0), onChange: jest.fn() },
  height: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useWindowSize hook
export const useWindowSize = jest.fn(() => ({
  width: { get: jest.fn(() => 1920), onChange: jest.fn() },
  height: { get: jest.fn(() => 1080), onChange: jest.fn() }
}));

// Mock useScroll hook
export const useScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useVelocity hook
export const useVelocity = jest.fn(() => ({
  get: jest.fn(() => 0),
  onChange: jest.fn()
}));

// Mock useWillChange hook
export const useWillChange = jest.fn(() => false);

// Mock useElementSize hook
export const useElementSize = jest.fn(() => ({
  width: { get: jest.fn(() => 0), onChange: jest.fn() },
  height: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useWindowSize hook
export const useWindowSize = jest.fn(() => ({
  width: { get: jest.fn(() => 1920), onChange: jest.fn() },
  height: { get: jest.fn(() => 1080), onChange: jest.fn() }
}));

// Mock useScroll hook
export const useScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useVelocity hook
export const useVelocity = jest.fn(() => ({
  get: jest.fn(() => 0),
  onChange: jest.fn()
}));

// Mock useWillChange hook
export const useWillChange = jest.fn(() => false);

// Mock useElementSize hook
export const useElementSize = jest.fn(() => ({
  width: { get: jest.fn(() => 0), onChange: jest.fn() },
  height: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useWindowSize hook
export const useWindowSize = jest.fn(() => ({
  width: { get: jest.fn(() => 1920), onChange: jest.fn() },
  height: { get: jest.fn(() => 1080), onChange: jest.fn() }
}));

// Mock useScroll hook
export const useScroll = jest.fn(() => ({
  scrollX: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollY: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollXProgress: { get: jest.fn(() => 0), onChange: jest.fn() },
  scrollYProgress: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useVelocity hook
export const useVelocity = jest.fn(() => ({
  get: jest.fn(() => 0),
  onChange: jest.fn()
}));

// Mock useWillChange hook
export const useWillChange = jest.fn(() => false);

// Mock useElementSize hook
export const useElementSize = jest.fn(() => ({
  width: { get: jest.fn(() => 0), onChange: jest.fn() },
  height: { get: jest.fn(() => 0), onChange: jest.fn() }
}));

// Mock useWindowSize hook
export const useWindowSize = jest.fn(() => ({
  width: { get: jest.fn(() => 1920), onChange: jest.fn() },
  height: { get: jest.fn(() => 1080), onChange: jest.fn() }
}));

// Export all mocks
export default {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useViewportScroll,
  useElementScroll,
  useCycle,
  useReducedMotion,
  usePresence,
  useDragControls,
  useGesture,
  useInView,
  useMotionValueEvent,
  useScroll,
  useVelocity,
  useWillChange,
  useElementSize,
  useWindowSize
};
