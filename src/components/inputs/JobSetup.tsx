// src/components/inputs/JobSetup.tsx
import React from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore'; // Correct path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type ProjectInfo } from '@/types/designTypes'; // Import the interface

export const JobSetup: React.FC = () => {
   const projectInfo = useBeamDesignStore((state) => state.projectInfo);
   const updateProjectInfo = useBeamDesignStore((state) => state.updateProjectInfo);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        updateProjectInfo({ [id]: value } as Partial<ProjectInfo>);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Setup</CardTitle>
                <CardDescription>Enter the project and design details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input id="projectName" value={projectInfo.projectName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="projectNo">Project No.</Label>
                        <Input id="projectNo" value={projectInfo.projectNo} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Input id="client" value={projectInfo.client} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={projectInfo.date} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="designer">Designer</Label>
                        <Input id="designer" value={projectInfo.designer} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="beamMark">Beam Mark</Label>
                        <Input id="beamMark" value={projectInfo.beamMark} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 col-span-full">
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" value={projectInfo.note} onChange={handleChange} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};