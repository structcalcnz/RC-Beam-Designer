// src/lib/designCalc.ts

import type { DesignForces, BeamGeometry, MaterialProperties } from '@/types/designTypes';

// The state from your Zustand store has a complex, nested structure.
// We'll define a type for the arguments our main function needs,
// which can be extracted from the full store state.
interface CalculationInputs {
  designForces: DesignForces;
  beamGeometry: BeamGeometry;
  materialProperties: MaterialProperties;
}

// Defines the structure for a single design result
export interface DesignOption {
  key: string; // Unique key for React rendering
  db: number;  n: number;  AsProv: number;
  ds: number;  legs: number;  ss: number;
  Mutil: number;   Vutil: number;
  warnings: string[];
}

const barArea = (d: number) => Math.PI * d * d / 4;
const stirrupArea = (ds: number, legs: number) => legs * barArea(ds);

/**
 * Calculates the concrete stress block factor, beta1, based on f'c.
 * Per NZS 3101, beta1 is 0.85 for f'c <= 30 MPa, and reduces linearly thereafter.
*/

function calculateBeta1(fc: number): number {
    if (fc <= 30) {
        return 0.85;
    }
    // Linearly reduce beta1 for f'c > 30 MPa, with a lower limit of 0.65.
    const beta = 0.85 - 0.008 * (fc - 30);
    return Math.max(beta, 0.65);
}

/**
 * Calculates a conservative minimum required steel area.
 * Based on NZS 3101: sqrt(f'c)/4fy * b * d
 * @returns Minimum steel area in mm².
 */
function calculateMinAs(fc: number, fy: number, B: number, d: number): number {
    if (fy === 0) return 0;
    return (Math.sqrt(fc) / (4 * fy)) * B * d;
}

/**
 * Checks if a given number of bars will fit in a single layer.
 * @returns An object indicating if the bars fit and a note if they don't.
 */
function checkBarSpacing(B: number, cover: number, ds: number, db: number, n: number): { fits: boolean; note?: string } {
    if (n <= 1) return { fits: true }; // A single bar always fits

    // Minimum clear spacing between bars (NZS 3101)
    // is the greater of bar diameter (db) or 25mm.
    const clearSpacing = Math.max(db, 25);

    const requiredWidth = (2 * cover) + (2 * ds) + (n * db) + ((n - 1) * clearSpacing);

    if (requiredWidth > B) {
        return { fits: false, note: "Needs multiple layers" };
    }
    return { fits: true };
}

interface RequiredAsParams {
    M: number; B: number; D: number; cover: number;
    fy: number; fc: number; beta1: number; phi_b: number;
    ds: number; db: number;
}

/**
 * Calculates the required area of steel reinforcement for bending.
 * @returns Required steel area in mm². Returns Infinity if no real solution exists.
 */
function calculateRequiredAs({ M, B, D, cover, fy, fc, beta1, phi_b, ds, db }: RequiredAsParams): number {
    const M_Nmm = M * 1e6; // Convert moment from kNm to Nmm
    const d = D - cover - ds - db / 2; // Effective depth

    // Quadratic equation coefficients for As: a*As^2 + b*As + c = 0
    const a = (fy ** 2) / (2 * beta1 * fc * B);
    const b = -fy * d;
    const c = M_Nmm / phi_b;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return Infinity; // No real solution, section is too small

    const root1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    // The smaller positive root is the physically valid solution
    const validRoots = [root1, root2].filter(x => x > 0);
    return validRoots.length > 0 ? Math.min(...validRoots) : Infinity;
}

/**
 * Main function to generate and evaluate reinforcement design options.
 * @param state - The current state object from the Zustand store.
 * @returns An array of feasible design options, sorted by efficiency.
 */
export function generateDesignOptions({ designForces, beamGeometry, materialProperties }: CalculationInputs): DesignOption[] {
    const { moment: M, shear: V, phi_b, phi_s } = designForces;
    const { breadth: B, depth: D, cover } = beamGeometry;
    const { concreteFc: fc, mainBarFy: fy, stirrupFys: fys } = materialProperties;

    const beta1 = calculateBeta1(fc);

    const dbList = [12, 16, 20, 25];
    const dsList = [6, 10, 12];
    const legsList = [2, 3, 4];
    const spacingList = [50, 100, 150, 200, 250, 300];

    const vbMin: number = 0.08 * Math.sqrt(fc);
    const vbMax: number = 0.2 * Math.sqrt(fc)
    const vnMax = Math.min(0.2 * fc, 8);

    const results: DesignOption[] = [];

    for (const db of dbList) {
        for (const ds of dsList) {
            const d = D - cover - ds - db / 2;
            if (d <= 0) continue; // Invalid geometry

            const warnings: string[] = []; // Initialize warnings array for this option

            const AsReq = calculateRequiredAs({ M, B, D, cover, fy, fc, beta1, phi_b, ds, db });
            if (!isFinite(AsReq)) continue;

            const n = Math.ceil(AsReq / barArea(db));
            const AsProv = n * barArea(db);

            // MINIMUM REINFORCEMENT CHECK
            const AsMin = calculateMinAs(fc, fy, B, d);
            if (AsProv < AsMin) {
                warnings.push("As < As,min");
            }
            
            // BAR SPACING CHECK
            const spacingCheck = checkBarSpacing(B, cover, ds, db, n);
            if (!spacingCheck.fits && spacingCheck.note) {
                warnings.push(spacingCheck.note);
            }

            // Nominal Moment Capacity (Mn)
            const a = (AsProv * fy) / (beta1 * fc * B);
            const Mn = AsProv * fy * (d - a / 2); // in Nmm
            const Mutil = (M * 1e6) / (phi_b * Mn);
            if (Mutil > 0.95) continue; // Filter out grossly inefficient or failed designs

            const rho = AsProv/(B * d);

            let vb: number;
            if (fy >= 20) {
                vb = Math.min(Math.max((0.07 + 10 * rho) * Math.sqrt(fc), vbMin), vbMax); // in N/mm2
            } else {
                vb = 0; // assume for masonry
            }

            let vc: number;
            if (d <= 200) {
             vc = Math.max(0.98 * vb, 0.17*0.98*Math.sqrt(fc), vbMax);
            } else if (d > 400) {
                vc = 0.98 * (400 /d)^0.25 * vb 
            } else {vc = 0.98 * vb}
            
            if (vc > vnMax) {vc = vnMax}            
            const Vc = vc*B*d

            let bestLegs: number | null = null;
            let bestSpacing: number | null = null;
            let bestVutil: number = Infinity;

            for (const legs of legsList) {
            const Av = stirrupArea(ds, legs);

                for (const ss of spacingList.slice().reverse()) { // Try larger spacings first
                    const Vs = (Av * fys * d) / ss;
                    const Vn = Vs + Vc;
                    const Vutil = (V * 1e3) / (phi_s * Vn);

                    if (Vutil <= 0.95) {
                    // First valid pair found — since legsList is ordered from min to max
                    bestLegs = legs;
                    bestSpacing = ss;
                    bestVutil = Vutil;
                    break; // Stop checking spacings for this legs count
                    }
                }

                if (bestLegs !== null) break; // Stop checking higher legs — we already found the minimum
            }

            if (bestLegs !== null && bestSpacing !== null) {
                results.push({
                    key: `${db}-${n}-${ds}-${bestLegs}-${bestSpacing}`,
                    db, n, AsProv: parseFloat(AsProv.toFixed(1)),
                    ds, legs: bestLegs, ss: bestSpacing,
                    Mutil: parseFloat(Mutil.toFixed(3)),
                    Vutil: parseFloat(bestVutil.toFixed(3)),
                    warnings,
                });
            }

        }
    }

    // Sort results by the sum of utilization ratios to find the most "efficient" options
    return results.sort((a, b) => (a.Mutil + a.Vutil) + (b.Mutil + b.Vutil));
}

