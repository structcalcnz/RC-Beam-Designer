// src/components/inputs/GeometryInput.tsx
import React, { useState, useEffect } from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const GeometryInput: React.FC = () => {
    const globalGeometry = useBeamDesignStore((state) => state.beamGeometry);
    const updateBeamGeometry = useBeamDesignStore((state) => state.updateBeamGeometry);

    //    Create local state for each input field. Initialize with values from the global store
    //    We store them as strings to allow for empty inputs during typing.
    const [breadth, setBreadth] = useState(String(globalGeometry.breadth));
    const [depth, setDepth] = useState(String(globalGeometry.depth));
    const [cover, setCover] = useState(String(globalGeometry.cover));
    const [span, setSpan] = useState(String(globalGeometry.span));

    //   Use useEffect to sync local state if the global state changes from another source
    //    (e.g., loading a saved design). This ensures the form always reflects the true source of truth.
    useEffect(() => {
        setBreadth(String(globalGeometry.breadth));
        setDepth(String(globalGeometry.depth));
        setCover(String(globalGeometry.cover));
        setSpan(String(globalGeometry.span));
    }, [globalGeometry]);

     //  Create a handler that updates the global store onBlur
    const handleBlur = (field: keyof typeof globalGeometry, value: string) => {
        const parsedValue = parseFloat(value);
        // If the parsed value is a valid number, update the global store.
        if (!isNaN(parsedValue) && parsedValue > 0) {
            updateBeamGeometry({ [field]: parsedValue });
        } else {
            // If the input is left empty or invalid, revert the local state
            // back to the last valid value from the global store.
            // This prevents the UI from showing an invalid state.
            switch (field) {
                case 'breadth': setBreadth(String(globalGeometry.breadth)); break;
                case 'depth': setDepth(String(globalGeometry.depth)); break;
                case 'cover': setCover(String(globalGeometry.cover)); break;
                case 'span': setSpan(String(globalGeometry.span)); break;
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beam Geometry</CardTitle>
                <CardDescription>Define the dimensions of the rectangular beam section.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Breadth Input */}
                    <div className="space-y-2">
                        <Label htmlFor="breadth">Breadth (B, mm)</Label>
                        <Input
                            id="breadth"
                            type="number"
                            value={breadth}
                            onChange={(e) => setBreadth(e.target.value)} // Update local state on change
                            onBlur={(e) => handleBlur('breadth', e.target.value)} // Update global store on blur
                        />
                    </div>
                    {/* Depth Input */}
                    <div className="space-y-2">
                        <Label htmlFor="depth">Overall Depth (D, mm)</Label>
                        <Input
                            id="depth"
                            type="number"
                            value={depth}
                            onChange={(e) => setDepth(e.target.value)}
                            onBlur={(e) => handleBlur('depth', e.target.value)}
                        />
                    </div>
                    {/* Cover Input */}
                    <div className="space-y-2">
                        <Label htmlFor="cover">Cover to Main Reinforcement (c, mm)</Label>
                        <Input
                            id="cover"
                            type="number"
                            value={cover}
                            onChange={(e) => setCover(e.target.value)}
                            onBlur={(e) => handleBlur('cover', e.target.value)}
                        />
                    </div>
                    {/* Span Input */}
                    <div className="space-y-2">
                        <Label htmlFor="span">Effective Span (L, m)</Label>
                        <Input
                            id="span"
                            type="number"
                            step="0.1"
                            value={span}
                            onChange={(e) => setSpan(e.target.value)}
                            onBlur={(e) => handleBlur('span', e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};