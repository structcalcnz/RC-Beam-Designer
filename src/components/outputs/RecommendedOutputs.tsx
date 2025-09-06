import React, { useState, useEffect } from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { generateDesignOptions, type DesignOption } from '@/lib/designCalc';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper to get bar prefix based on grade name
const getMainBarPrefix = (gradeName: string) => {
    if (gradeName.includes('500')) return 'HD';
    return 'D';
};
const getStirrupPrefix = (gradeName: string) => {
    if (gradeName.includes('500')) return 'HR';
    return 'R';
};

export const RecommendedOutputs: React.FC = () => {
    const [options, setOptions] = useState<DesignOption[]>([]);
    const [hasCalculated, setHasCalculated] = useState(false);
    const stage = useBeamDesignStore((state) => state.stage);

    // Reset options when stage goes back to 0 (new design)
    useEffect(() => {
        if (stage === 0) {
            setOptions([]); // clear the local state
            setHasCalculated(false);
        }
    }, [stage]);
    
    // Get the action from the store to update the final design
    const updateFinalReinforcement = useBeamDesignStore((state) => state.updateFinalReinforcement);
    const materialProperties = useBeamDesignStore((state) => state.materialProperties);

    const handleCalculateClick = () => {
        const currentState = useBeamDesignStore.getState();
        const newOptions = generateDesignOptions({
            designForces: currentState.designForces,
            beamGeometry: currentState.beamGeometry,
            materialProperties: currentState.materialProperties,
        });
        setOptions(newOptions);
        setHasCalculated(true);
        useBeamDesignStore.getState().setStage(1);
    };

    const handleRowSelect = (option: DesignOption) => {
        updateFinalReinforcement({
            n: option.n,
            db: option.db,
            ds: option.ds,
            ss: option.ss,
            legs: option.legs,
        });
        useBeamDesignStore.getState().setStage(2);
        // Optional: scroll to the detailed design component
        document.getElementById('final-design')?.scrollIntoView({ behavior: 'smooth' });
    };

    const mainBarPrefix = getMainBarPrefix(materialProperties.mainBarGradeName);
    const stirrupPrefix = getStirrupPrefix(materialProperties.stirrupGradeName);

    const [page, setPage] = useState(0);
    const pageSize = 10;

    return (
        <Card>
            {/* ... (CardHeader remains the same) ... */}
            <CardContent>
                {!hasCalculated ? (
                    <div className="text-center py-8 space-y-4">
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Ready to Calculate</AlertTitle>
                            <AlertDescription>
                                Click the button below to generate reinforcement options based on your inputs.
                            </AlertDescription>
                        </Alert>
                        <Button onClick={handleCalculateClick} size="lg">Calculate Designs</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <Button onClick={handleCalculateClick} variant="outline">Recalculate</Button>
                        </div>

                        {options.length === 0 ? (
                            <Alert variant="destructive">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>No Feasible Options Found</AlertTitle>
                                <AlertDescription>
                                    Try increasing the beam depth or material strengths.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <Alert variant="default" className="bg-blue-50 dark:bg-blue-950">
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>Next Step</AlertTitle>
                                    <AlertDescription>
                                        Select a row from the table below to load it into the Final Design section for editing and detailed checks.
                                    </AlertDescription>
                                </Alert>
                                <div
                                    className="hidden md:block w-full max-w-full overflow-x-auto relative z-10"
                                    style={{ WebkitOverflowScrolling: 'touch' }} // for iOS smooth scroll
                                > 
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Main Bars</TableHead>
                                                <TableHead>Stirrups</TableHead>
                                                <TableHead>M* Util.</TableHead>
                                                <TableHead>V* Util.</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {options.slice(page * pageSize, (page + 1) * pageSize).map((opt) => (
                                                <TableRow key={opt.key} onClick={() => handleRowSelect(opt)} className="cursor-pointer hover:bg-muted/50">
                                                    <TableCell className="font-medium">{opt.n} x {mainBarPrefix}{opt.db}</TableCell>
                                                    <TableCell>{stirrupPrefix}{opt.ds} @ {opt.ss}mm ({opt.legs} legs)</TableCell>
                                                    <TableCell className={opt.Mutil > 1.0 ? 'text-red-500' : ''}>{opt.Mutil.toFixed(2)}</TableCell>
                                                    <TableCell className={opt.Vutil > 1.0 ? 'text-red-500' : ''}>{opt.Vutil.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        {opt.warnings.map(w => <Badge key={w} variant="destructive" className="mr-1">{w}</Badge>)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Small screens: card-like layout */}
                                <div className="space-y-2 md:hidden text-sm">
                                    {options.slice(page * pageSize, (page + 1) * pageSize).map((opt) => (
                                        <div
                                        key={opt.key}
                                        onClick={() => handleRowSelect(opt)}
                                        className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm"
                                        >
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">Main Bars:</span>
                                            <span>{opt.n} x {mainBarPrefix}{opt.db}</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">Stirrups:</span>
                                            <span>{stirrupPrefix}{opt.ds} @ {opt.ss}mm ({opt.legs} legs)</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">M* Util.:</span>
                                            <span className={opt.Mutil > 1.0 ? "text-red-500" : ""}>{opt.Mutil.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">V* Util.:</span>
                                            <span className={opt.Vutil > 1.0 ? "text-red-500" : ""}>{opt.Vutil.toFixed(2)}</span>
                                        </div>
                                        {opt.warnings.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                            {opt.warnings.map((w) => (
                                                <span
                                                key={w}
                                                className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded"
                                                >
                                                {w}
                                                </span>
                                            ))}
                                            </div>
                                        )}
                                        </div>
                                    ))}
                                    </div>
                                <div className="flex justify-center items-center space-x-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 0}
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                                    >
                                        &lt;
                                    </Button>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Page {page + 1} of {Math.ceil(options.length / pageSize)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page + 1) * pageSize >= options.length}
                                        onClick={() => setPage((prev) => prev + 1)}
                                    >
                                        &gt;
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};