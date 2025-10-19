import React from 'react';

export const Tabs = ({ children, ...props }) => <div data-testid="tabs" {...props}>{children}</div>;
export const TabsContent = ({ children, ...props }) => <div data-testid="tabs-content" {...props}>{children}</div>;
export const TabsList = ({ children, ...props }) => <div data-testid="tabs-list" {...props}>{children}</div>;
export const TabsTrigger = ({ children, ...props }) => <div data-testid="tabs-trigger" {...props}>{children}</div>;
