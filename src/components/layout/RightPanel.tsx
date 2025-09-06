// src/components/layout/RightPanel.tsx
import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { BeamCanvas } from '../preview/BeamCanvas';
import { DraftingCompass } from 'lucide-react';

export const RightPanel: React.FC = () => {
    const finalReinforcement = useBeamDesignStore((state) => state.finalReinforcement);

    return (
        // Use Flexbox to center the content both vertically and horizontally
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
            {finalReinforcement ? (
                <BeamCanvas />
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <DraftingCompass className="mx-auto h-16 w-16" />
                    <h2 className="mt-4 text-xl font-semibold">Beam Preview</h2>
                    <p>The beam section will be displayed here once a design is selected.</p>
                </div>
            )}
        </div>
    );
};