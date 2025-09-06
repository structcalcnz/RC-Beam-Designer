// src/components/inputs/LoadsInput.tsx
import React, { useState } from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DesignForces } from '@/types/designTypes'; // Import the interface
import { cn } from '@/lib/utils'; // For styling placeholders

export const LoadsInput: React.FC = () => {
    const designForces = useBeamDesignStore((state) => state.designForces);
    const updateDesignForces = useBeamDesignStore((state) => state.updateDesignForces);

    // State to manage if custom input is active for phi_b
    const [isCustomPhiB, setIsCustomPhiB] = useState(false);
    // State to manage if custom input is active for phi_s
    const [isCustomPhiS, setIsCustomPhiS] = useState(false);

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof DesignForces) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            updateDesignForces({ [field]: value });
        }
    };

    const handlePhiBChange = (value: string) => {
        if (value === 'custom') {
            setIsCustomPhiB(true);
        } else {
            setIsCustomPhiB(false);
            updateDesignForces({ phi_b: parseFloat(value) });
        }
    };

    const handlePhiSChange = (value: string) => {
        if (value === 'custom') {
            setIsCustomPhiS(true);
        } else {
            setIsCustomPhiS(false);
            updateDesignForces({ phi_s: parseFloat(value) });
        }
    };

    // Determine the displayed value for SelectTrigger
    const getPhiBSelectValue = () => {
        if (isCustomPhiB) return 'custom';
        if (designForces.phi_b === 0.85) return '0.85';
        if (designForces.phi_b === 1.00) return '1.00';
        return 'custom'; // Fallback if custom was set but state was reset or value is unique
    };

    const getPhiSSelectValue = () => {
        if (isCustomPhiS) return 'custom';
        if (designForces.phi_s === 0.75) return '0.75';
        if (designForces.phi_s === 1.00) return '1.00';
        return 'custom'; // Fallback
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Design Loads</CardTitle>
                <CardDescription>Enter the ultimate design forces and resistance factors.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Moment Input */}
                    <div className="space-y-2">
                        <Label htmlFor="moment">Moment (M*, kNm)</Label>
                        <Input
                            id="moment"
                            type="number"
                            value={designForces.moment}
                            onChange={(e) => handleNumericChange(e, 'moment')}
                        />
                    </div>
                    {/* Phi_b Select & Custom Input */}
                    <div className="space-y-2">
                        <Label htmlFor="phi_b">Factor ɸ_b</Label>
                        <div className="flex space-x-2">
                            <Select onValueChange={handlePhiBChange} value={getPhiBSelectValue()}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Φ_b" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.85">0.85</SelectItem>
                                    <SelectItem value="1.00">1.00</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomPhiB && (
                                <Input
                                    id="phi_b_custom"
                                    type="number"
                                    step="0.01"
                                    value={designForces.phi_b}
                                    onChange={(e) => handleNumericChange(e, 'phi_b')}
                                    className="flex-1"
                                />
                            )}
                        </div>
                    </div>

                    {/* Shear Input */}
                    <div className="space-y-2">
                        <Label htmlFor="shear">Shear (V*, kN)</Label>
                        <Input
                            id="shear"
                            type="number"
                            value={designForces.shear}
                            onChange={(e) => handleNumericChange(e, 'shear')}
                        />
                    </div>
                    {/* Phi_s Select & Custom Input */}
                    <div className="space-y-2">
                        <Label htmlFor="phi_s">Factor ɸ_s</Label>
                        <div className="flex space-x-2">
                            <Select onValueChange={handlePhiSChange} value={getPhiSSelectValue()}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Φ_s" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.75">0.75</SelectItem>
                                    <SelectItem value="1.00">1.00</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomPhiS && (
                                <Input
                                    id="phi_s_custom"
                                    type="number"
                                    step="0.01"
                                    value={designForces.phi_s}
                                    onChange={(e) => handleNumericChange(e, 'phi_s')}
                                    className="flex-1"
                                />
                            )}
                        </div>
                    </div>

                    {/* Axial Load Input (Placeholder) */}
                    <div className="space-y-2"> {/* Make it span full width */}
                        <Label htmlFor="axialLoad" className="text-gray-400 italic">Axial Load (N*, kN) / Factor ɸ_o</Label>
                        <div className="flex space-x-2">
                            <Input
                                id="axialLoad"
                                type="number"
                                value={designForces.axialLoad}
                                onChange={(e) => handleNumericChange(e, 'axialLoad')}
                                className={cn("flex-1", { "text-gray-400 italic": designForces.axialLoad === 0 })}
                                placeholder="Axial load (placeholder)"
                                disabled // Grayed out/disabled for now
                            />
                            <Input
                                id="phi_o"
                                type="number"
                                step="0.01"
                                value={designForces.phi_o}
                                onChange={(e) => handleNumericChange(e, 'phi_o')}
                                className={cn("w-[120px]", { "text-gray-400 italic": designForces.phi_o === 1.20 })}
                                placeholder="Φ_o (placeholder)"
                                disabled // Grayed out/disabled for now
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};