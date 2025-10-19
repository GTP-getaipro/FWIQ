import React from 'react';

export const Select = ({ children, ...props }) => <div data-testid="select" {...props}>{children}</div>;
export const SelectContent = ({ children, ...props }) => <div data-testid="select-content" {...props}>{children}</div>;
export const SelectItem = ({ children, ...props }) => <div data-testid="select-item" {...props}>{children}</div>;
export const SelectTrigger = ({ children, ...props }) => <div data-testid="select-trigger" {...props}>{children}</div>;
export const SelectValue = ({ children, ...props }) => <div data-testid="select-value" {...props}>{children}</div>;
