// src/components/layout/Footer.tsx
import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';

export const Footer: React.FC = () => {
    const stage = useBeamDesignStore((state) => state.stage);

    const stageStatus = () => {
    switch(stage) {
        case 0: return "Ready – start by entering input data.";
        case 1: return "Design options generated – pick an option.";
        case 2: return "Option selected – review, modify, and run checks.";
        case 3: return "Detailed design completed – adjust and recheck if needed.";
        case 4: return "SLS checks completed – review and correct any issues.";
        case 5: return "Design saved successfully.";
        case 6: return "Design loaded – review or continue editing.";
        default: return "Unknown stage";
    }
    };
    return (
        <footer className="flex items-center p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            <span>Status: {stageStatus()}</span>
            <span className="flex-1 text-right mr-6">Units: kN, mm, MPa</span>
            <span className="text-right">© 2025 NZSC v0.9</span>
        </footer>
    );
};