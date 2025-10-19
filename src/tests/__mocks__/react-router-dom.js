/**
 * React Router DOM Mock for Testing
 * Mock implementation for React Router DOM components and hooks
 */

import React from 'react';

// Mock useNavigate hook
export const useNavigate = jest.fn(() => jest.fn());

// Mock useLocation hook
export const useLocation = jest.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
}));

// Mock useParams hook
export const useParams = jest.fn(() => ({}));

// Mock useSearchParams hook
export const useSearchParams = jest.fn(() => [
  new URLSearchParams(),
  jest.fn()
]);

// Mock BrowserRouter component
export const BrowserRouter = ({ children }) => (
  <div data-testid="browser-router">{children}</div>
);

// Mock Routes component
export const Routes = ({ children }) => (
  <div data-testid="routes">{children}</div>
);

// Mock Route component
export const Route = ({ element, path }) => (
  <div data-testid={`route-${path}`}>{element}</div>
);

// Mock Link component
export const Link = ({ to, children, ...props }) => (
  <a href={to} data-testid="router-link" {...props}>
    {children}
  </a>
);

// Mock NavLink component
export const NavLink = ({ to, children, ...props }) => (
  <a href={to} data-testid="nav-link" {...props}>
    {children}
  </a>
);

// Mock Navigate component
export const Navigate = ({ to, replace = false }) => (
  <div data-testid="navigate" data-to={to} data-replace={replace}>
    Navigate to {to}
  </div>
);

// Mock Outlet component
export const Outlet = () => (
  <div data-testid="outlet">Outlet</div>
);

// Mock useOutlet hook
export const useOutlet = jest.fn(() => null);

// Mock useOutletContext hook
export const useOutletContext = jest.fn(() => ({}));

// Mock useResolvedPath hook
export const useResolvedPath = jest.fn((to) => ({
  pathname: typeof to === 'string' ? to : to.pathname,
  search: '',
  hash: ''
}));

// Mock useHref hook
export const useHref = jest.fn((to) => typeof to === 'string' ? to : to.pathname);

// Mock useLinkClickHandler hook
export const useLinkClickHandler = jest.fn(() => jest.fn());

// Mock useFormAction hook
export const useFormAction = jest.fn(() => '/');

// Mock useFetcher hook
export const useFetcher = jest.fn(() => ({
  data: null,
  state: 'idle',
  formMethod: null,
  formAction: null,
  formEncType: 'application/x-www-form-urlencoded',
  formData: null,
  load: jest.fn(),
  submit: jest.fn()
}));

// Mock useFetchers hook
export const useFetchers = jest.fn(() => []);

// Mock useLoaderData hook
export const useLoaderData = jest.fn(() => null);

// Mock useActionData hook
export const useActionData = jest.fn(() => null);

// Mock useNavigation hook
export const useNavigation = jest.fn(() => ({
  state: 'idle',
  location: null,
  formMethod: null,
  formAction: null,
  formEncType: null,
  formData: null
}));

// Mock useRevalidator hook
export const useRevalidator = jest.fn(() => ({
  state: 'idle',
  revalidate: jest.fn()
}));

// Mock useRouteLoaderData hook
export const useRouteLoaderData = jest.fn(() => null);

// Mock useMatches hook
export const useMatches = jest.fn(() => []);

// Mock useRouteError hook
export const useRouteError = jest.fn(() => null);

// Mock useBlocker hook
export const useBlocker = jest.fn(() => false);

// Mock usePrompt hook
export const usePrompt = jest.fn(() => {});

// Mock useBeforeUnload hook
export const useBeforeUnload = jest.fn(() => {});

// Mock createBrowserRouter function
export const createBrowserRouter = jest.fn(() => []);

// Mock createMemoryRouter function
export const createMemoryRouter = jest.fn(() => []);

// Mock createHashRouter function
export const createHashRouter = jest.fn(() => []);

// Mock RouterProvider component
export const RouterProvider = ({ router }) => (
  <div data-testid="router-provider">
    {router}
  </div>
);

// Mock MemoryRouter component
export const MemoryRouter = ({ children }) => (
  <div data-testid="memory-router">{children}</div>
);

// Mock HashRouter component
export const HashRouter = ({ children }) => (
  <div data-testid="hash-router">{children}</div>
);

// Mock StaticRouter component
export const StaticRouter = ({ children }) => (
  <div data-testid="static-router">{children}</div>
);

// Mock generatePath function
export const generatePath = jest.fn((pattern, params = {}) => {
  let path = pattern;
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
});

// Mock matchRoutes function
export const matchRoutes = jest.fn(() => []);

// Mock matchPath function
export const matchPath = jest.fn(() => null);

// Mock resolvePath function
export const resolvePath = jest.fn((to, fromPathname = '/') => ({
  pathname: typeof to === 'string' ? to : to.pathname,
  search: '',
  hash: ''
}));

// Mock createSearchParams function
export const createSearchParams = jest.fn(() => new URLSearchParams());

// Mock unstable_HistoryRouter component
export const unstable_HistoryRouter = ({ children }) => (
  <div data-testid="history-router">{children}</div>
);

// Mock unstable_HistoryRouter component
export const unstable_HistoryRouter = ({ children }) => (
  <div data-testid="history-router">{children}</div>
);

// Export all mocks
export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useOutlet,
  useOutletContext,
  useResolvedPath,
  useHref,
  useLinkClickHandler,
  useFormAction,
  useFetcher,
  useFetchers,
  useLoaderData,
  useActionData,
  useNavigation,
  useRevalidator,
  useRouteLoaderData,
  useMatches,
  useRouteError,
  useBlocker,
  usePrompt,
  useBeforeUnload,
  createBrowserRouter,
  createMemoryRouter,
  createHashRouter,
  RouterProvider,
  MemoryRouter,
  HashRouter,
  StaticRouter,
  generatePath,
  matchRoutes,
  matchPath,
  resolvePath,
  createSearchParams,
  unstable_HistoryRouter
};
