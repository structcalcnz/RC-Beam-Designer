// src/stores/beamDesignStore.ts
import { create } from 'zustand';
import { produce } from 'immer';
import type { BeamGeometry, ProjectInfo, DesignForces,
    MaterialProperties, FinalReinforcement, DesignCheckInputs, DesignCheckResults,
    SLSDesignInputs, SLSCheckResultsArray
} from '../types/designTypes';
//import { useStaticDataStore } from './staticDataStore';
import { v4 as uuidv4 } from 'uuid';

// Initial empty/default states for various design parts


// const initialReinforcement: ReinforcementDesign = {
//     mainBarsBottom: [{ numBars: 0, diameter: 0, area: 0 }],
//     mainBarsTop: [{ numBars: 0, diameter: 0, area: 0 }],
//     shearReinforcement: { diameter: 0, spacing: 0, legs: 2, area: 0 },
// };


// New: Initial ProjectInfo
const initialProjectInfo: ProjectInfo = {
    id: uuidv4(),
    projectName: "My RC Beam Project",
    projectNo: "P-001",
    client: "Client Name",
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    designer: "Your Name",
    beamMark: "BM1",
    note: ""
};

// New: Initial DesignForces
const initialDesignForces: DesignForces = {
    moment: 50, // Example initial value
    phi_b: 0.85, // Default for bending
    shear: 50,   // Example initial value
    phi_s: 0.75, // Default for shear
    axialLoad: 0, // Placeholder
    phi_o: 0.85,  // Placeholder
};
// Initial state for BeamGeometry
const initialBeamGeometry: BeamGeometry = {
    breadth: 200, // mm
    depth: 400,   // mm
    cover: 30,    // mm
    span: 5,      // meters
};

// Initial state for MaterialProperties
const initialMaterialProperties: MaterialProperties= {
    sectionMaterialType: 'concrete',
    concreteGradeName: 'C30',
    concreteFc: 30, // Default to C30 values
    concreteEc: 25084, // Default to C30 values
    mainBarGradeName: '500E',
    mainBarFy: 500, // Default to 500MPa values
    mainBarEs: 200000, // Default to 500MPa values
    stirrupGradeName: '300E',
    stirrupFys: 300, // Default to 250MPa values
    stirrupEs: 200000, // Default to 250MPa values
};

const initialReinforcement: FinalReinforcement ={
    n: 2,   
    db: 16,     
    ds: 10,
    ss: 200,
    legs: 2,
}

const initialDesignCheckInputs: DesignCheckInputs = {
    masonryShearStrengthVm: 0,
    isMinShearReinforcementWaived: false,
};

const initialSLSDesignInputs: SLSDesignInputs = {
    serviceMoment: 38,       // Default M*s = 38 kNm
    shrinkageStrain: 600e-6, // Default shrinkage strain
    crackWidthLimit: 0.3,
};

export interface BeamDesignData {
  id: string;
  projectInfo: ProjectInfo;
  codeStandard: string;
  designForces: DesignForces;
  beamGeometry: BeamGeometry;
  materialProperties: MaterialProperties;
  finalReinforcement: FinalReinforcement | null;
  designCheckInputs: DesignCheckInputs;
  slsDesignInputs: SLSDesignInputs;
  createdAt: string;
  lastModified: string;
}

// Update LiveBeamDesignState to include projectInfo and its update action
// Overall design state interface
interface BeamDesignState{
    id: string; // Unique ID for this design
    projectInfo: ProjectInfo;
    codeStandard: string; // 

    designForces: DesignForces;
    beamGeometry: BeamGeometry;
    materialProperties: MaterialProperties;

    finalReinforcement: FinalReinforcement | null;
    designCheckInputs: DesignCheckInputs;
    designCheckResults: DesignCheckResults | null; // Can be null until a check is run
    slsDesignInputs: SLSDesignInputs;
    slsCheckResults: SLSCheckResultsArray | null;

    // Add other states if necessary
    createdAt: string; // ISO date string
    lastModified: string; // ISO date string

    //running status
    stage: number; // 0 = initial, 1 = design options generated, 2 = detailed check completed, etc.
    setStage: (stage: number) => void;
    // Actions
    updateProjectInfo: (updates: Partial<ProjectInfo>) => void; 
    updateDesignForces: (updates: Partial<DesignForces>) => void;
    updateBeamGeometry: (updates: Partial<BeamGeometry>) => void;
    updateMaterialProperties: (updates: Partial<MaterialProperties>) => void;
    updateFinalReinforcement: (reinf: FinalReinforcement) => void;
    updateDesignCheckInputs: (inputs: Partial<DesignCheckInputs>) => void;
    setDesignCheckResults: (results: DesignCheckResults | null) => void;
    updateSLSDesignInputs: (inputs: Partial<SLSDesignInputs>) => void;
    setSLSCheckResults: (results: SLSCheckResultsArray | null) => void;

    // Design management
    newDesign: () => void;
    loadDesign: (design: BeamDesignData) => void;
    exportDesign: () => BeamDesignData;
}

export const useBeamDesignStore = create<BeamDesignState>((set, get) => ({
    id: uuidv4(),
    projectInfo: initialProjectInfo,
    codeStandard: "NZS3101, NZS4230",
    designForces: initialDesignForces,
    beamGeometry: initialBeamGeometry,
    materialProperties: initialMaterialProperties,

    finalReinforcement: initialReinforcement,
    designCheckInputs: initialDesignCheckInputs,
    designCheckResults: null,
    slsDesignInputs: initialSLSDesignInputs,
    slsCheckResults: null,

    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    
    stage: 0,
    setStage: (stage) => set({ stage }),

    // New Action to update ProjectInfo
    updateProjectInfo: (updates) => set(produce((state) => {
        state.projectInfo = { ...state.projectInfo, ...updates };
    })),

    updateDesignForces: (updates) => set(produce((state) => {
        state.designForces = { ...state.designForces, ...updates };
    })),

    updateBeamGeometry: (updates) => set(produce((state) => {
        state.beamGeometry = { ...state.beamGeometry, ...updates };
    })),

    updateMaterialProperties: (updates) => set(produce((state) => {
        state.materialProperties = { ...state.materialProperties, ...updates };
    })),

    updateFinalReinforcement: (reinf) => set({
        finalReinforcement: reinf,
    }),

    updateDesignCheckInputs: (inputs) => set((state) => ({
        designCheckInputs: { ...state.designCheckInputs, ...inputs },
    })),
    
    setDesignCheckResults: (results) => set({
        designCheckResults: results,
    }),

    updateSLSDesignInputs: (inputs) => set((state) => ({
        slsDesignInputs: { ...state.slsDesignInputs, ...inputs },
    })),
    
    setSLSCheckResults: (results) => set({
        slsCheckResults: results,
    }),

    // --- Design Management ---
    newDesign: () => set({
    id: uuidv4(),
    projectInfo: initialProjectInfo,
    codeStandard: "NZS3101, NZS4230",
    designForces: initialDesignForces,
    beamGeometry: initialBeamGeometry,
    materialProperties: initialMaterialProperties,
    finalReinforcement: initialReinforcement,
    designCheckInputs: initialDesignCheckInputs,
    designCheckResults: null,
    slsDesignInputs: initialSLSDesignInputs,
    slsCheckResults: null,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(), 
    stage: 0,
    }),

    // Update loadDesign action to correctly populate projectInfo
    loadDesign: (design) => {
        console.log("Loading design:", design),
        set({        
            id: design.id ?? uuidv4(),
        projectInfo: { ...initialProjectInfo, ...(design.projectInfo ?? {}) },
        codeStandard: design.codeStandard ?? 'NZS3101, NZS4230',
        designForces: { ...initialDesignForces, ...(design.designForces ?? {}) },
        beamGeometry: { ...initialBeamGeometry, ...(design.beamGeometry ?? {}) },
        materialProperties: { ...initialMaterialProperties, ...(design.materialProperties ?? {}) },
        finalReinforcement: design.finalReinforcement ?? initialReinforcement,
        designCheckInputs: { ...initialDesignCheckInputs, ...(design.designCheckInputs ?? {}) },
        designCheckResults: null,
        slsDesignInputs: { ...initialSLSDesignInputs, ...(design.slsDesignInputs ?? {}) },
        slsCheckResults: null,
        createdAt: design.createdAt ?? new Date().toISOString(),
        lastModified: new Date().toISOString(),      
        }),
    console.log("Store after load:", get())},

    // Update exportDesign to include projectInfo
    exportDesign: () => {
        const state = get();
        return {
        id: state.id,
        projectInfo: { ...state.projectInfo },
        codeStandard: state.codeStandard,
        designForces: { ...state.designForces },
        beamGeometry: { ...state.beamGeometry },
        materialProperties: { ...state.materialProperties },
        finalReinforcement: state.finalReinforcement,
        designCheckInputs: { ...state.designCheckInputs },
        slsDesignInputs: { ...state.slsDesignInputs },
        createdAt: state.createdAt,
        lastModified: new Date().toISOString(),
        };
    }
}));