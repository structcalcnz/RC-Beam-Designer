import { useBeamDesignStore } from '@/stores/beamDesignStore';
import type { DesignCheckResults, CheckResult } from '@/types/designTypes';
import materialData from '@/data/material_database.json'; // To get strain values

// Helper functions from your designCalc library might be useful here
const barArea = (d: number) => (Math.PI * d * d) / 4;
const stirrupArea = (ds: number, legs: number) => legs * barArea(ds);
const calculateBeta1 = (fc: number) => (fc <= 30 ? 0.85 : Math.max(0.85 - 0.008 * (fc - 30), 0.65));

export function performDetailedCheck(): DesignCheckResults {
    const state = useBeamDesignStore.getState();
    const { designForces, beamGeometry, materialProperties, finalReinforcement, designCheckInputs } = state;
    
    // Guard against running check without a final design
    if (!finalReinforcement) return [];

    const { moment: M, shear: V, phi_b, phi_s } = designForces;
    const { breadth: B, depth: D, cover } = beamGeometry;
    const { concreteFc: fc, mainBarFy: fy, stirrupFys: fys, sectionMaterialType } = materialProperties;
    const { n, db, ds, ss, legs } = finalReinforcement;
    const { masonryShearStrengthVm: vm, isMinShearReinforcementWaived } = designCheckInputs;

    const results: CheckResult[] = [];

    // --- 1. Basic Properties ---
    const d = D - cover - ds - db / 2;
    const As = n * barArea(db);
    const rho = As / (B * d);
    results.push({ checkName: 'Effective Depth, d', value: `${d.toFixed(1)} mm`, limit: '-', status: 'info' });
    results.push({ checkName: 'Reinforcement Area, As', value: `${As.toFixed(1)} mm²`, limit: '-', status: 'info' });
    results.push({ checkName: 'Reinforcement Ratio, ρ', value: `${(rho * 100).toFixed(3)} %`, limit: '-', status: 'info' });

    // --- 2. Minimum Reinforcement ---
    const As_min1 = (Math.sqrt(fc) / (4 * fy)) * B * d;
    const As_min2 = (1.4 / fy) * B * d;
    const As_min_limit = Math.max(As_min1, As_min2);
    results.push({
        checkName: 'Minimum Reinforcement, As_min', value: `${As.toFixed(1)} mm²`, limit: `≥ ${As_min_limit.toFixed(1)} mm²`,
        status: As >= As_min_limit ? 'pass' : 'fail',
    });

    // --- 3. Ductility / Compressive Limit ---
    const beta1 = calculateBeta1(fc);
    const a = (As * fy) / (0.85 * fc * B);
    const c = a / beta1;
    const concreteStrain = materialData.materialProperties.find(m => m.type === 'concrete')?.strain || 0.003;
    const rebarStrain = materialData.materialProperties.find(m => m.type === 'rebar')?.strain || 0.0025;
    const cb = d * (concreteStrain / (concreteStrain + rebarStrain));
    const c_limit = 0.75 * cb;
    results.push({
        checkName: 'Ductility (Neutral Axis Depth), c', value: `${c.toFixed(1)} mm`, limit: `≤ ${c_limit.toFixed(1)} mm`,
        status: c <= c_limit ? 'pass' : 'fail',
    });

    // --- 4. Moment Capacity ---
    const jd = d - a / 2;
    const Mn = As * fy * jd; // In Nmm
    const phi_Mn = (phi_b * Mn) / 1e6; // In kNm
    results.push({
        checkName: 'Moment Capacity', value: `M* = ${M.toFixed(1)} kNm`, limit: `≤ ɸMn = ${phi_Mn.toFixed(1)} kNm`,
        status: M <= phi_Mn ? 'pass' : 'fail',
    });
    
    // --- 5. Shear Capacity ---
    const V_star_N = V * 1e3; // V* in Newtons
    let Vc = 0;
    if (sectionMaterialType === 'concrete') {
        const vbMin = 0.08 * Math.sqrt(fc);
        const vbMax = 0.2 * Math.sqrt(fc);
        const vnMax = Math.min(0.2 * fc, 8);
        const vb = Math.min(Math.max((0.07 + 10 * rho) * Math.sqrt(fc), vbMin), vbMax);
        let vc = (d <= 200) ? Math.max(0.98 * vb, 0.17 * 0.98 * Math.sqrt(fc)) :
                 (d > 400) ? 0.98 * Math.pow(400 / d, 0.25) * vb : 0.98 * vb;
        vc = Math.min(vc, vnMax);
        Vc = vc * B * d;
    } else { // Masonry
        Vc = vm * B * d;
    }
    const Av = stirrupArea(ds, legs);
    const Vs = (Av * fys * d) / ss;
    const Vn = Vs + Vc;
    const phi_Vn = phi_s * Vn;
    results.push({
        checkName: 'Shear Capacity', value: `V* = ${V.toFixed(1)} kN`, limit: `≤ ɸVn = ${(phi_Vn / 1000).toFixed(1)} kN`,
        status: V_star_N <= phi_Vn ? 'pass' : 'fail',
        notes: `Vc: ${(Vc/1000).toFixed(1)} kN, Vs: ${(Vs/1000).toFixed(1)} kN`,
    });

    // --- 6. Shear Reinforcement Limits ---
    if (V_star_N <= 0.5 * phi_s * Vc) {
        results.push({ checkName: 'Shear Reinforcement Minima', value: '-', limit: '-', status: 'pass', notes: 'V* ≤ 0.5ɸVc, minimum stirrups not required by strength.' });
    } else if (isMinShearReinforcementWaived) {
        results.push({ checkName: 'Shear Reinforcement Minima', value: '-', limit: '-', status: 'pass', notes: 'User has waived minimum shear reinforcement checks per NZS3101.' });
    } else {
        //const Av_min = (1 / 16) * Math.sqrt(fc) * B * (1000/fys);  Note: This is Av/s, so we check Av/s vs Av_min
        const Av_provided_per_mm = Av / ss;
        const Av_min_per_mm = (1/16) * Math.sqrt(fc) * B / fys;
        
        results.push({ checkName: 'Min. Stirrup Area, Ast_min', value: `${(Av_provided_per_mm).toFixed(2)} mm²/mm`, limit: `≥ ${(Av_min_per_mm).toFixed(2)} mm²/mm`, status: Av_provided_per_mm >= Av_min_per_mm ? 'pass' : 'fail'});

        let max_ss_limit = Math.min(0.5 * d, 600);
        let reason = 'Default';
        const s_legs = legs > 1 ? (B - 2 * cover - ds) / (legs - 1) : Infinity;
        if (Vs > 0.33 * Math.sqrt(fc) * B * d && !(B > 0.5 * d && s_legs >= 200)) {
            max_ss_limit = Math.min(0.25 * d, 300);
            reason = 'High shear';
        }
        results.push({ checkName: 'Max. Stirrup Spacing, s', value: `${ss} mm`, limit: `≤ ${max_ss_limit.toFixed(0)} mm (${reason})`, status: ss <= max_ss_limit ? 'pass' : 'fail'});

        if (B > 0.5 * d) {
             const max_s_legs_limit = Math.min(0.5*d, 600);
             results.push({ checkName: 'Max. Leg Spacing, s_leg', value: `${s_legs.toFixed(0)} mm`, limit: `≤ ${max_s_legs_limit.toFixed(0)} mm`, status: s_legs <= max_s_legs_limit ? 'pass' : 'fail'});
        }
    }
    
    return results;
}