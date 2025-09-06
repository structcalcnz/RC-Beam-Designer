import { useBeamDesignStore } from '@/stores/beamDesignStore';
import type { CheckResult } from '@/types/designTypes';


// Helper to calculate bar area
const barArea = (d: number) => (Math.PI * d * d) / 4;

// ---  helper functions ---
// 1. solveCurvatureWithYieldCheck
// Units must be consistent:
// - Moments: N·mm
// - fc, fy, Es: MPa (N/mm²)
// - B, d, c: mm
// - As: mm²
// - Return phi_c in 1/mm, Mn in N·mm

type SolveResult = {
  ok: true;
  branch: 'elastic' | 'yielded';
  c: number;          // mm
  fs: number;         // MPa (N/mm²)
  phi_c: number;      // 1/mm
  C: number;          // N
  T: number;          // N
  Mc: number;         // N·mm
  Ms: number;         // N·mm
  Mn: number;         // N·mm
  checks: {
    discriminant?: number;
    elastic_fs?: number;
    yielded: boolean;
    Mn_ge_required?: boolean;
  };
} | {
  ok: false;
  reason: string;
};

function solveCurvatureWithYieldCheck(params: {
  M: number;        // design moment M* [N·mm]
  phi_b: number;    // strength reduction for bending
  fc: number;       // f'c [MPa]
  beta1: number;    // beta1
  B: number;        // breadth [mm]
  d: number;        // effective depth to tension steel [mm]
  As: number;       // tension steel area [mm²]
  Es: number;       // steel modulus [MPa]
  fy: number;       // steel yield [MPa]
}) : SolveResult {
  const { M, phi_b, fc, beta1, B, d, As, Es, fy } = params;

  // Basic checks
  if (As <= 0) return { ok: false, reason: "As must be > 0" };
  if (B <= 0 || d <= 0) return { ok: false, reason: "B and d must be > 0" };
  if (Es <= 0 || fy <= 0 || fc <= 0) return { ok: false, reason: "Material properties must be positive" };

  // Elastic closed-form path (same as earlier)
  // Solve quadratic for c from: 0.85*fc*beta1*c*B*(d - beta1*c/2) = M/phi_b
  // Rearranged discriminant form used previously
  const denom = 0.85 * fc * B; // N/mm per unit c
  const term = d * d - (2 * (M / phi_b)) / denom;

  if (term < 0) {
    return { ok: false, reason: "Demand exceeds concrete block limit (negative discriminant)." };
  }

  const c_el = (d - Math.sqrt(term)) / beta1;
  if (!(c_el > 0 && c_el < d)) {
    return { ok: false, reason: "Computed neutral axis depth (elastic) not physical." };
  }

  const C_el = 0.85 * fc * beta1 * c_el * B; // N
  const fs_el = C_el / As; // MPa (N/mm²)
  const phi_c_el = fs_el / (Es * (d - c_el)); // 1/mm

  // if not yielded -> return elastic branch
  if (fs_el <= fy) {
    const Mc = C_el * (c_el - beta1 * c_el / 2); // N·mm
    const Ms = (As * fs_el) * (d - c_el); // N·mm (should match Mc)
    const Mn = Mc + Ms;
    const Mn_required = M / phi_b;
    return {
      ok: true,
      branch: 'elastic',
      c: c_el,
      fs: fs_el,
      phi_c: phi_c_el,
      C: C_el,
      T: As * fs_el,
      Mc, Ms, Mn,
      checks: {
        discriminant: term,
        elastic_fs: fs_el,
        yielded: false,
        Mn_ge_required: Mn + 1e-9 >= Mn_required
      }
    };
  }

  // Otherwise steel yielded -> yielded branch
  // Set fs = fy, T = As * fy, equilibrium gives c:
  const T_y = As * fy; // N
  const c_y = T_y / (0.85 * fc * beta1 * B); // mm
  // sanity check c
  if (!(c_y > 0 && c_y < d)) {
    // If c_y >= d then tension is too big for this geometry -> section fails or needs more depth
    return { ok: false, reason: `Yielded neutral axis depth invalid (c=${c_y.toFixed(2)} mm).` };
  }

  const C_y = 0.85 * fc * beta1 * c_y * B; // should equal T_y (numerical)
  const Mc_y = C_y * (c_y - beta1 * c_y / 2);
  const Ms_y = T_y * (d - c_y);
  const Mn_y = Mc_y + Ms_y;
  const phi_c_min = fy / (Es * (d - c_y)); // 1/mm minimal curvature to reach fy

  const Mn_required = M / phi_b;

  return {
    ok: true,
    branch: 'yielded',
    c: c_y,
    fs: fy,
    phi_c: phi_c_min,
    C: C_y,
    T: T_y,
    Mc: Mc_y,
    Ms: Ms_y,
    Mn: Mn_y,
    checks: {
      yielded: true,
      Mn_ge_required: Mn_y + 1e-9 >= Mn_required
    }
  };
}


// Helper function to calculate steel stress under a given moment
function getSteelStress(M_Nmm: number) {
    const state = useBeamDesignStore.getState();
    const { beamGeometry, materialProperties, finalReinforcement } = state;
    if (!finalReinforcement) return { ok: false, reason: "Final reinforcement not set." };

    const { concreteFc: fc, mainBarFy: fy, mainBarEs: Es } = materialProperties;
    const { breadth: B } = beamGeometry;
    const { n, db, ds } = finalReinforcement;
    
    const As = (Math.PI * db * db / 4) * n;
    const d = beamGeometry.depth - beamGeometry.cover - ds - db / 2;
    const beta1 = fc <= 30 ? 0.85 : Math.max(0.85 - 0.008 * (fc - 30), 0.65);

    // This is a simplified call assuming M is the required moment capacity,
    // not the design moment M*. For stress calculation, phi_b should be 1.0.
    return solveCurvatureWithYieldCheck({ M: M_Nmm, phi_b: 1.0, fc, beta1, B, d, As, Es, fy });
}


function calculateShrinkageStress() {
    const state = useBeamDesignStore.getState();
    const { beamGeometry, materialProperties, finalReinforcement } = state;
    if (!finalReinforcement) return { fsc_half: 0 };

    const { breadth: B, depth: D } = beamGeometry;
    const { mainBarEs: Es, concreteEc: Ec } = materialProperties;
    const As = (Math.PI * finalReinforcement.db**2 / 4) * finalReinforcement.n;
    const eps_sh = state.slsDesignInputs.shrinkageStrain;

    const Ac = B * D;
    const rho = As / Ac;
    const n_ratio = Es / Ec;
    const fsc_full = Es * eps_sh / (1 + n_ratio * rho); 
    return { fsc_half: 0.5 * fsc_full };
}

function calculateCrackWidth(fs: number, fsc_half: number) {
    const state = useBeamDesignStore.getState();
    const { beamGeometry, finalReinforcement, materialProperties } = state;
    if (!finalReinforcement) return 0;
    
    const { breadth: B, cover } = beamGeometry;
    const { n, db, ds } = finalReinforcement;
    const { mainBarEs: Es } = materialProperties;

    const s = n > 1 ? (B - 2 * cover - 2 * ds - db) / (n - 1) : B / 2;
    const fs_eff = fs + fsc_half;
    const gs = Math.sqrt((s/2)**2 + (cover + ds + db/2)**2) - db/2;

    return 2 * gs * (fs_eff / Es); // w in mm
}

// --- Main orchestrating function ---
export function performSLSCheck(): CheckResult[] | { error: string } {
    const state = useBeamDesignStore.getState();
    const { designForces, slsDesignInputs, beamGeometry, materialProperties, finalReinforcement } = state;

    if (!finalReinforcement) return { error: "Desgined reinforcement not set." };

    const results: CheckResult[] = [];
    const { serviceMoment: M_sls_kNm, crackWidthLimit } = slsDesignInputs;
    const { breadth: B, depth: D } = beamGeometry;
    const { concreteFc: fc, mainBarFy: fy, mainBarEs: Es, concreteEc: Ec } = materialProperties;
    const { n, db } = finalReinforcement;

    // --- Stress Checks ---
    const ulsStressResult = getSteelStress(designForces.moment * 1e6);
    const slsStressResult = getSteelStress(M_sls_kNm * 1e6);

    if (!ulsStressResult.ok) {
        return { error: ulsStressResult.reason || "ULS stress calculation failed." };
    }
    if (!slsStressResult.ok) {
        return { error: slsStressResult.reason || "SLS stress calculation failed." };
    }
    if (ulsStressResult.ok === true) {
      results.push({
          checkName: 'ULS Steel Stress, fsu',
          value: `${('fs' in ulsStressResult ? ulsStressResult.fs.toFixed(1) : 'N/A')} MPa`,
          limit: `fy = ${fy.toFixed(0)} MPa`,
          status: (ulsStressResult as Extract<typeof ulsStressResult, { ok: true }>).branch === 'yielded' ? 'fail' : 'pass',
          notes: (ulsStressResult as Extract<typeof ulsStressResult, { ok: true }>).branch,
      });
    }
    if (slsStressResult.ok === true) {
      results.push({
          checkName: 'SLS Steel Stress, fss',
          value: `${('fs' in slsStressResult ? slsStressResult.fs.toFixed(1) : 'N/A')} MPa`,
          limit: '-',
          status: 'info'
      });
    }

    // --- Crack Width Checks ---
    const { fsc_half } = calculateShrinkageStress();
    results.push({ checkName: 'Shrinkage Stress, fsc', value: `${fsc_half.toFixed(1)} MPa`, limit: '-', status: 'info' });

    const fs_sls = (slsStressResult.ok === true && 'fs' in slsStressResult) ? slsStressResult.fs : 0;
    const w_sls = calculateCrackWidth(fs_sls, fsc_half);
    results.push({
        checkName: 'SLS Crack Width, w_sls', value: `${w_sls.toFixed(3)} mm`, limit: `≤ ${crackWidthLimit.toFixed(2)} mm`,
        status: w_sls <= crackWidthLimit ? 'pass' : 'fail',
    });

    // --- Stiffness Checks (Ie & Kcs) ---
    const n_ratio = Es / Ec;
    const As = n * barArea(db);
    const d = D - beamGeometry.cover - finalReinforcement.ds - db / 2;

    // Solve for cracked neutral axis depth 'x' from Bx^2/2 - n*As*(d-x) = 0
    const a_quad = B / 2;
    const b_quad = n_ratio * As;
    const c_quad = -n_ratio * As * d;
    const x = (-b_quad + Math.sqrt(b_quad**2 - 4 * a_quad * c_quad)) / (2 * a_quad);

    const Ig = (B * D**3) / 12;
    const Icr = (B * x**3) / 3 + n_ratio * As * (d - x)**2;
    const fr = 0.6 * Math.sqrt(fc);
    const Mcr = (fr * Ig) / (D / 2);
    const Ms_Nmm = M_sls_kNm * 1e6;
    
    let Ie = Ig;
    if (Ms_Nmm > Mcr) {
        const ratio = (Mcr / Ms_Nmm)**3;
        Ie = ratio * Ig + (1 - ratio) * Icr;
    }
    
    results.push({ checkName: 'Effective Inertia, Ie', value: `${(Ie / 1e9).toExponential(2)} m⁴`, limit: '-', status: 'info' });
    results.push({ checkName: 'Stiffness Ratio, Ie/Ig', value: `${(Ie/Ig).toFixed(3)}`, limit: '-', status: 'info' });

    // Kcs Factor
    const Asc = 2 * barArea(12); // Per user request for 2xD12 top bars
    const rho_c = Asc / (B * d);
    const Kcs = 2 / (1 + 50 * rho_c);
    results.push({ checkName: 'Long-term Factor, Kcs', value: `${Kcs.toFixed(2)}`, limit: '-', status: 'info', notes: 'For sustained loads' });

    return results;
}