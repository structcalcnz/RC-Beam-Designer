import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const FinalDesignOutput: React.FC = () => {
    const designCheckResults = useBeamDesignStore((state) => state.designCheckResults);

    if (!designCheckResults) {
        return (
             <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Detailed Check Results</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10 text-muted-foreground">
                    <p>Click "Detailed Checks" to see the results.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (designCheckResults.length === 0) {
        return <p>Please select a final design first.</p>; // Edge case
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detailed Design Check Results</CardTitle>
                <CardDescription>Validation against NZS 3101 / NZS 4230 standards.</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="hidden md:block w-full max-w-full overflow-x-auto relative z-10"
                    style={{ WebkitOverflowScrolling: 'touch' }} // for iOS smooth scroll
                > 
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Check</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Limit</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {designCheckResults.map((result, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{result.checkName}</TableCell>
                                    <TableCell>{result.value}</TableCell>
                                    <TableCell>{result.limit}</TableCell>
                                    <TableCell>
                                        <Badge variant={result.status === 'pass' ? 'default' : result.status === 'fail' ? 'destructive' : 'secondary'}
                                               className={cn(result.status === 'pass' && 'bg-green-600')}>
                                            {result.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Small screens: card-like layout */}
                <div className="space-y-2 md:hidden text-sm">
                    {designCheckResults.map((result, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex justify-between mb-1">
                            <span className="font-medium">Check:</span>
                            <span>{result.checkName}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="font-medium">Value:</span>
                            <span>{result.value}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="font-medium">Limit:</span>
                            <span>{result.limit}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="font-medium">Status:</span>
                            <span>
                            <Badge
                                variant={
                                result.status === 'pass'
                                    ? 'default'
                                    : result.status === 'fail'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className={cn(result.status === 'pass' && 'bg-green-600')}
                            >
                                {result.status.toUpperCase()}
                            </Badge>
                            </span>
                        </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};