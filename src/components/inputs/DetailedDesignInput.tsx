import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { performDetailedCheck } from '@/lib/detailedCheck';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, DraftingCompass } from 'lucide-react';

export const DetailedDesignInput: React.FC = () => {
    // Subscribe to the finalReinforcement slice of the store
    const finalReinforcement = useBeamDesignStore((state) => state.finalReinforcement);
    const updateFinalReinforcement = useBeamDesignStore((state) => state.updateFinalReinforcement);
    const { designCheckInputs, updateDesignCheckInputs, setDesignCheckResults, materialProperties } = useBeamDesignStore();
    const designStage = useBeamDesignStore((state) => state.stage);

    // The "Detail Check" button is best placed here, as it's the action for these inputs.
    const handleDetailCheckClick = () => {
        const results = performDetailedCheck();
        setDesignCheckResults(results);
        // Scroll to the results
        document.getElementById('final-design-output')?.scrollIntoView({ behavior: 'smooth' });
        useBeamDesignStore.getState().setStage(3);
    };

    // If no design has been selected yet, show a placeholder
    if (!finalReinforcement) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Final Design</CardTitle>
                    <CardDescription>Your finalized reinforcement details will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        <DraftingCompass className="mx-auto h-12 w-12" />
                        <p className="mt-4">Select a recommended option above to begin.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handler to update a specific field in the final reinforcement object
    const handleFieldChange = (field: keyof typeof finalReinforcement, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            updateFinalReinforcement({
                ...finalReinforcement,
                [field]: numValue,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Final Design Details</CardTitle>
                <CardDescription>
                    Review, edit, and confirm the final reinforcement. The preview will update as you type.
                </CardDescription>
            </CardHeader>
            <CardContent>
                    {/* Show alert only if design options haven’t been run */}
                    {(designStage <= 1) && (
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Initial Reinforcement Only</AlertTitle>
                        <AlertDescription>
                        This is a default reinforcement setup. You are recommended to run the design options above
                        and select one to start. However, you can still manually edit and input values here.
                        </AlertDescription>
                    </Alert>
                    )}
                
                    {/* Main Bars Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="main-bars-n">No. of Bars</Label>
                            <Input id="main-bars-n" type="number" value={finalReinforcement.n} onChange={(e) => handleFieldChange('n', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="main-bars-db">Bar Diameter (mm)</Label>
                            <Input id="main-bars-db" type="number" value={finalReinforcement.db} onChange={(e) => handleFieldChange('db', e.target.value)} />
                        </div>
                    </div>
                    {/* Stirrups Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label htmlFor="stirrups-ds">Stirrup Dia. (mm)</Label>
                            <Input id="stirrups-ds" type="number" value={finalReinforcement.ds} onChange={(e) => handleFieldChange('ds', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stirrups-ss">Stirrup Spacing (mm)</Label>
                            <Input id="stirrups-ss" type="number" step={25} value={finalReinforcement.ss} onChange={(e) => handleFieldChange('ss', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stirrups-legs">No. of Legs</Label>
                            <Input id="stirrups-legs" type="number" value={finalReinforcement.legs} onChange={(e) => handleFieldChange('legs', e.target.value)} />
                        </div>
                    </div>
              

                {/* --- Conditional Inputs for Masonry--- */}
                {materialProperties.sectionMaterialType === 'masonry' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                        <Label htmlFor="masonry-vm">Masonry Shear Strength (vm, MPa)</Label>
                        <Input id="masonry-vm" type="number" step="0.1" value={designCheckInputs.masonryShearStrengthVm}
                               onChange={(e) => updateDesignCheckInputs({ masonryShearStrengthVm: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-2 mt-6">
                    <Checkbox id="waive-min-shear" checked={designCheckInputs.isMinShearReinforcementWaived}
                              onCheckedChange={(checked) => updateDesignCheckInputs({ isMinShearReinforcementWaived: !!checked })} />
                    <Label htmlFor="waive-min-shear" className="text-sm text-muted-foreground">
                        Waive minimum shear reinforcement checks per NZS3101 Cl 9.3.9.4.13
                    </Label>
                </div>

                {/* --- Detail Check Button --- */}
                <div className="text-center mt-6">
                    <Button onClick={handleDetailCheckClick}>Detailed Checks</Button>
                </div>
            </CardContent>
        </Card>
    );
};