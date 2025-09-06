import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { performSLSCheck } from '@/lib/slsCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const SLSDesignInput: React.FC = () => {
    const slsDesignInputs = useBeamDesignStore((state) => state.slsDesignInputs);
    const { updateSLSDesignInputs, setSLSCheckResults, finalReinforcement } = useBeamDesignStore();

    const handleRunCheck = () => {
        const results = performSLSCheck();
        if ('error' in results) {
            alert(`Calculation Error: ${results.error}`);
            setSLSCheckResults(null);
        } else {
            setSLSCheckResults(results);
            document.getElementById('sls-output')?.scrollIntoView({ behavior: 'smooth' });
            useBeamDesignStore.getState().setStage(4);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>SLS Checks (Crack Width)</CardTitle>
                <CardDescription>Enter serviceability loads and properties to check crack widths.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sls-moment">Service Moment (M*s, kNm)</Label>
                        <Input id="sls-moment" type="number" value={slsDesignInputs.serviceMoment}
                               onChange={(e) => updateSLSDesignInputs({ serviceMoment: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sls-strain">Shrinkage Strain (ε_sh, x10⁻⁶)</Label>
                        <Input id="sls-strain" type="number" step={50} value={slsDesignInputs.shrinkageStrain * 1e6}
                               onChange={(e) => updateSLSDesignInputs({ shrinkageStrain: parseFloat(e.target.value) * 1e-6 })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sls-crack-limit">Crack Width Limit (mm)</Label>
                        <Input id="sls-crack-limit" type="number" step="0.1" value={slsDesignInputs.crackWidthLimit}
                               onChange={(e) => updateSLSDesignInputs({ crackWidthLimit: parseFloat(e.target.value) })} />
                    </div>
                </div>
                <div className="text-center mt-6">
                    <Button onClick={handleRunCheck} disabled={!finalReinforcement}>
                        SLS Checks
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};