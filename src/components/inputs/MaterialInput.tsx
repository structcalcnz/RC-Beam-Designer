// src/components/inputs/MaterialInput.tsx
import React, { useEffect, useState } from 'react';
import { useBeamDesignStore } from '@/stores/beamDesignStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type {
    MaterialDatabase,
    ConcreteGrade,
    MasonryGrade,
    RebarGrade
} from '@/types/designTypes';

// Import the JSON data
import materialData from '@/data/material_database.json';

export const MaterialInput: React.FC = () => {
    const materialProperties = useBeamDesignStore((state) => state.materialProperties);
    const updateMaterialProperties = useBeamDesignStore((state) => state.updateMaterialProperties);

    const [concreteGrades, setConcreteGrades] = useState<ConcreteGrade[]>([]);
    const [masonryGrades, setMasonryGrades] = useState<MasonryGrade[]>([]);
    const [rebarGrades, setRebarGrades] = useState<RebarGrade[]>([] as RebarGrade[]);

    // Load material data on component mount
    useEffect(() => {
        const parsedData = materialData as MaterialDatabase;
        const concrete = parsedData.materialProperties.find(m => m.type === 'concrete');
        const masonry = parsedData.materialProperties.find(m => m.type === 'masonry');
        const rebar = parsedData.materialProperties.find(m => m.type === 'rebar');

        if (concrete) setConcreteGrades(concrete.grade as ConcreteGrade[]);
        if (masonry) setMasonryGrades(masonry.grade as MasonryGrade[]);
        if (rebar) setRebarGrades(rebar.grade as RebarGrade[]);

        // Initialize with default values if not already set in store or if they don't match initial loaded data
        // This is important to ensure the derived values (fc, Ec, fy, Es) are correct on initial load.
        if (!materialProperties.concreteFc && concreteGrades.length > 0) {
            handleConcreteGradeChange(materialProperties.concreteGradeName || concreteGrades[0].name);
        }
        if (!materialProperties.mainBarFy && rebarGrades.length > 0) {
            handleMainBarGradeChange(materialProperties.mainBarGradeName || rebarGrades[0].name);
        }
        if (!materialProperties.stirrupFys && rebarGrades.length > 0) {
            handleStirrupGradeChange(materialProperties.stirrupGradeName || rebarGrades[0].name);
        }
    }, [materialProperties.concreteFc, materialProperties.mainBarFy, materialProperties.stirrupFys]);


    // Handlers for material type and grades
    const handleSectionMaterialTypeChange = (value: 'concrete' | 'masonry') => {
        updateMaterialProperties({ sectionMaterialType: value });
        // Reset concrete/masonry grade selection and derived values when material type changes
        if (value === 'concrete' && concreteGrades.length > 0) {
            handleConcreteGradeChange(concreteGrades[0].name);
        } else if (value === 'masonry' && masonryGrades.length > 0) {
            handleMasonryGradeChange(masonryGrades[0].name);
        }
    };

    const handleConcreteGradeChange = (gradeName: string) => {
        const selectedGrade = concreteGrades.find(grade => grade.name === gradeName);
        if (selectedGrade) {
            updateMaterialProperties({
                concreteGradeName: gradeName,
                concreteFc: selectedGrade.fc,
                concreteEc: selectedGrade.Ec,
            });
        }
    };

    const handleMasonryGradeChange = (gradeName: string) => {
        const selectedGrade = masonryGrades.find(grade => grade.name === gradeName);
        if (selectedGrade) {
            updateMaterialProperties({
                concreteGradeName: gradeName, // Reusing concreteGradeName for masonry for simplicity, could be masonryGradeName
                concreteFc: selectedGrade.fc,
                concreteEc: selectedGrade.Ec,
            });
        }
    };

    const handleMainBarGradeChange = (gradeName: string) => {
        const selectedGrade = rebarGrades.find(grade => grade.name === gradeName);
        if (selectedGrade) {
            updateMaterialProperties({
                mainBarGradeName: gradeName,
                mainBarFy: selectedGrade.fy,
                mainBarEs: selectedGrade.Es,
            });
        }
    };

    const handleStirrupGradeChange = (gradeName: string) => {
        const selectedGrade = rebarGrades.find(grade => grade.name === gradeName);
        if (selectedGrade) {
            updateMaterialProperties({
                stirrupGradeName: gradeName,
                stirrupFys: selectedGrade.fy,
                stirrupEs: selectedGrade.Es,
            });
        }
    };

    // Determine current concrete/masonry grades based on selected material type
    const currentSectionGrades = materialProperties.sectionMaterialType === 'concrete'
        ? concreteGrades
        : masonryGrades;

    // Determine the currently selected grade name for the section material
    const currentSectionGradeName = materialProperties.concreteGradeName;

    const SELECT_WIDTH = '200px';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Material Properties</CardTitle>
                <CardDescription>Select the materials used for the beam section and reinforcement.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section Material Type */}
                    <div className="space-y-2">
                        <Label htmlFor="sectionMaterialType">Section Material</Label>
                        <Select
                            onValueChange={handleSectionMaterialTypeChange}
                            value={materialProperties.sectionMaterialType}
                        >
                            <SelectTrigger style={{ width: SELECT_WIDTH }}>
                                <SelectValue placeholder="Select Material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="concrete">Concrete</SelectItem>
                                <SelectItem value="masonry">Masonry</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Concrete/Masonry Strength (f'c) */}
                    <div className="space-y-2">
                        <Label htmlFor="concreteGrade">
                            {materialProperties.sectionMaterialType === 'concrete' ? "Concrete Strength (f'c)" : "Masonry Strength (f'm)"}
                        </Label>
                        <Select
                            onValueChange={(value) => {
                                if (materialProperties.sectionMaterialType === 'concrete') {
                                    handleConcreteGradeChange(value);
                                } else {
                                    handleMasonryGradeChange(value);
                                }
                            }}
                            value={currentSectionGradeName}
                        >
                            <SelectTrigger style={{ width: SELECT_WIDTH }}>
                                <SelectValue placeholder={`Select ${materialProperties.sectionMaterialType === 'concrete' ? "Concrete" : "Masonry"} Grade`} />
                            </SelectTrigger>
                            <SelectContent>
                                {currentSectionGrades.map((grade) => (
                                    <SelectItem key={grade.name} value={grade.name}>
                                        {grade.name} ({grade.fc} MPa)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Main Bar Strength (f'y) */}
                    <div className="space-y-2">
                        <Label htmlFor="mainBarGrade">Main Reinforcement Strength (f'y)</Label>
                        <Select
                            onValueChange={handleMainBarGradeChange}
                            value={materialProperties.mainBarGradeName}
                        >
                            <SelectTrigger style={{ width: SELECT_WIDTH }}>
                                <SelectValue placeholder="Select Main Bar Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {rebarGrades.map((grade) => (
                                    <SelectItem key={grade.name} value={grade.name}>
                                        {grade.name} ({grade.fy} MPa)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stirrup Strength (f'ys) */}
                    <div className="space-y-2">
                        <Label htmlFor="stirrupGrade">Stirrup Reinforcement Strength (f'ys)</Label>
                        <Select
                            onValueChange={handleStirrupGradeChange}
                            value={materialProperties.stirrupGradeName}
                        >
                            <SelectTrigger style={{ width: SELECT_WIDTH }}>
                                <SelectValue placeholder="Select Stirrup Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {rebarGrades.map((grade) => (
                                    <SelectItem key={grade.name} value={grade.name}>
                                        {grade.name} ({grade.fy} MPa)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Display Derived Values (Read-only Inputs) */}
                    <div className="space-y-2" style={{ width: SELECT_WIDTH }}>
                        <Label htmlFor="fc_derived" className="text-muted-foreground">Derived f'c (MPa)</Label>
                        <Input
                            id="fc_derived"
                            type="number"
                            value={materialProperties.concreteFc}
                            readOnly
                            disabled
                        />
                    </div>
                    <div className="space-y-2" style={{ width: SELECT_WIDTH }}>
                        <Label htmlFor="Ec_derived" className="text-muted-foreground">Derived Ec (MPa)</Label>
                        <Input
                            id="Ec_derived"
                            type="number"
                            value={materialProperties.concreteEc}
                            readOnly
                            disabled
                        />
                    </div>
                    <div className="space-y-2" style={{ width: SELECT_WIDTH }}>
                        <Label htmlFor="fy_derived" className="text-muted-foreground">Derived f'y (MPa)</Label>
                        <Input
                            id="fy_derived"
                            type="number"
                            value={materialProperties.mainBarFy}
                            readOnly
                            disabled
                        />
                    </div>
                    <div className="space-y-2" style={{ width: SELECT_WIDTH }}>
                        <Label htmlFor="fys_derived" className="text-muted-foreground">Derived f'ys (MPa)</Label>
                        <Input
                            id="fys_derived"
                            type="number"
                            value={materialProperties.stirrupFys}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};