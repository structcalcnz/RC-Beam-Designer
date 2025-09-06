// src/components/layout/Header.tsx
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RC Beam Designer</h1>
        </header>
    );
};