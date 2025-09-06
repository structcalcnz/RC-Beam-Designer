// src/types/designTypes.ts
export interface ProjectInfo {
    id: string; // Unique ID for the project instance
    projectName: string;
    projectNo: string;
    client: string;
    date: string; // ISO date string, or a simple string if preferred
    designer: string;
    beamMark: string;
    note: string;
}

export interface DesignForces {
    moment: number; // M* (kNm)
    phi_b: number; // Resistance factor for bending
    shear: number; // V* (kN)
    phi_s: number; // Resistance factor for shear
    axialLoad: number; // N* (kN)
    phi_o: number; // Resistance factor for axial load (placeholder)
}

export interface BeamGeometry {
    breadth: number; // mm
    depth: number; // mm
    cover: number; // mm
    span: number; // meters
}

// Interfaces for material database
export interface ConcreteGrade {
    name: string;
    fc: number; // MPa
    Ec: number; // MPa
}

export interface MasonryGrade {
    name: string;
    fc: number; // MPa
    Ec: number; // MPa
}

export interface RebarGrade {
    name: string;
    fy: number; // MPa
    Es: number; // MPa
}

export interface MaterialType {
    type: 'concrete' | 'masonry' | 'rebar';
    strain: number;
    grade: ConcreteGrade[] | MasonryGrade[] | RebarGrade[];
}

export interface MaterialDatabase {
    materialProperties: MaterialType[];
}

export interface MaterialProperties {
    sectionMaterialType: 'concrete' | 'masonry'; // 'concrete' or 'masonry'
    concreteGradeName: string; // e.g., "C30"
    concreteFc: number; // f'c, MPa (derived from selected grade)
    concreteEc: number; // Ec, MPa (derived from selected grade)
    mainBarGradeName: string; // e.g., "500MPa"
    mainBarFy: number; // f'y, MPa (derived from selected grade)
    mainBarEs: number; // Es, MPa (derived from selected grade)
    stirrupGradeName: string; // e.g., "250MPa"
    stirrupFys: number; // f'ys, MPa (derived from selected grade)
    stirrupEs: number; // Es, MPa (derived from selected grade)
}

// Represents the user's final, editable reinforcement choice
export interface FinalReinforcement {
    n: number;      // Number of main bars
    db: number;     // Diameter of main bars (mm)
    ds: number;     // Diameter of stirrups (mm)
    ss: number;     // Spacing of stirrups (mm)
    legs: number;   // Number of stirrup legs
}

// To hold the new specific inputs for detailed checks
export interface DesignCheckInputs {
    masonryShearStrengthVm: number; // vm in MPa
    isMinShearReinforcementWaived: boolean;
}

// Defines the structure for a single check result for clear UI rendering
export interface CheckResult {
    checkName: string;      // e.g., "Minimum Reinforcement"
    value: string;          // The calculated value, e.g., "1256 mm²"
    limit: string;          // The code limit, e.g., ">= 560 mm²"
    status: 'pass' | 'fail' | 'info';
    notes?: string;         // Optional additional notes
}

// The complete set of results from the detailed check
export type DesignCheckResults = CheckResult[];

// Inputs specific to SLS checks
export interface SLSDesignInputs {
    serviceMoment: number;      // M*s in kNm
    shrinkageStrain: number;    // eps_sh, unitless (e.g., 600e-6)
     crackWidthLimit: number;    // User-defined limit in mm
}

// The structured results from the SLS check
export type SLSCheckResultsArray = CheckResult[];