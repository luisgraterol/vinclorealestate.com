import { describe, it, expect } from 'vitest';
import {
  calcMaintenance,
  calcFixedCosts,
  calcAll,
  calcMonth1Carry,
  calcRampMonthlyNets,
  expandRampFactors,
  defaultRampSettings,
  getScenariosData,
  getRiskFlags,
  type AnalysisInputs,
} from '@lib/calculations';
import { capOcc, OCC_CAP } from '@lib/constants';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_INPUTS: AnalysisInputs = {
  rentNeg: 1200,
  rentAsk: 1400,
  deposit: 1400,
  adr: 167,
  occ: 77,
  avgStay: 3.2,
  cleaning: 120,
  utilities: 185,
  electricity: 0,
  water: 0,
  sewer: 0,
  garbage: 0,
  internet: 80,
  insurance: 100,
  supplies: 120,
  linens: 0,
  pms: 39,
  pricing: 20,
  minutSubscription: 0,
  streaming: 0,
  airbnbFeeType: '3%',
  hasYard: false,
  lawnCare: 0,
  pestControl: 0,
  bulkPickup: 0,
  preventiveInspection: 0,
  hvacFilters: 0,
  cpa: 0,
  furniture: 6500,
  photo: 200,
  lock: 150,
  legal: 300,
  misc: 500,
  minutHardware: 0,
  wifiRouter: 0,
  welcomeKits: 0,
  isHOA: false,
};

// ── calcMaintenance ───────────────────────────────────────────────────────────

describe('calcMaintenance', () => {
  it('clamps to floor of $75 when 1.5% is below it', () => {
    expect(calcMaintenance(1000)).toBe(75);
  });

  it('returns 1.5% of rent when in range', () => {
    expect(calcMaintenance(8000)).toBeCloseTo(120);
  });

  it('clamps to ceiling of $150 when 1.5% exceeds it', () => {
    expect(calcMaintenance(15000)).toBe(150);
  });

  it('clamps to floor for $0 rent', () => {
    expect(calcMaintenance(0)).toBe(75);
  });
});

// ── calcFixedCosts ────────────────────────────────────────────────────────────

describe('calcFixedCosts', () => {
  it('sums all cost lines including computed maintenance', () => {
    const maintenance = calcMaintenance(BASE_INPUTS.rentNeg); // 75 (floor)
    // BASE_INPUTS zeros out all new fields so only legacy fields contribute
    const expected =
      BASE_INPUTS.rentNeg +
      BASE_INPUTS.utilities +
      BASE_INPUTS.internet +
      BASE_INPUTS.insurance +
      BASE_INPUTS.supplies +
      BASE_INPUTS.pms +
      BASE_INPUTS.pricing +
      maintenance;
    expect(calcFixedCosts(BASE_INPUTS)).toBeCloseTo(expected);
  });

  it('does not drop internet when it is zero', () => {
    const noInternet = { ...BASE_INPUTS, internet: 0 };
    const withInternet = calcFixedCosts(BASE_INPUTS);
    const without = calcFixedCosts(noInternet);
    expect(withInternet - without).toBeCloseTo(BASE_INPUTS.internet);
  });
});

// ── calcAll ───────────────────────────────────────────────────────────────────

describe('calcAll', () => {
  it('returns correct gross revenue for base case', () => {
    const r = calcAll(BASE_INPUTS);
    // adr * (occ/100) * 30
    expect(r.grossRevenue).toBeCloseTo(167 * 0.77 * 30, 0);
  });

  it('deducts 3% Airbnb fee from gross to get netPlatform', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.airbnbFee).toBeCloseTo(r.grossRevenue * 0.03, 4);
    expect(r.netPlatform).toBeCloseTo(r.grossRevenue * 0.97, 4);
  });

  it('computes netMonthly = netPlatform − fixed', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.netMonthly).toBeCloseTo(r.netPlatform - r.fixed, 4);
  });

  it('computes netAnnual = netMonthly * 12', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.netAnnual).toBeCloseTo(r.netMonthly * 12, 4);
  });

  it('computes staysPerMonth from occupancy and avg stay length', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.staysPerMonth).toBeCloseTo((0.77 * 30) / 3.2, 4);
  });

  it('computes totalInvest as sum of one-time costs', () => {
    const r = calcAll(BASE_INPUTS);
    const expected =
      BASE_INPUTS.deposit + BASE_INPUTS.furniture + BASE_INPUTS.photo +
      BASE_INPUTS.lock + BASE_INPUTS.legal + BASE_INPUTS.misc;
    expect(r.totalInvest).toBeCloseTo(expected, 4);
  });

  it('computes roi12 = (netAnnual / totalInvest) * 100', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.roi12).toBeCloseTo((r.netAnnual / r.totalInvest) * 100, 4);
  });

  it('computes roi24 = (netAnnual * 2 / totalInvest) * 100', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.roi24).toBeCloseTo((r.netAnnual * 2 / r.totalInvest) * 100, 4);
  });

  it('computes payback = totalInvest / netMonthly when profitable', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.payback).toBeCloseTo(r.totalInvest / r.netMonthly, 4);
  });

  it('returns Infinity payback when net monthly is zero or negative', () => {
    const r = calcAll({ ...BASE_INPUTS, occ: 0 });
    expect(r.payback).toBe(Infinity);
  });

  it('returns all zeros for revenue when occupancy is zero', () => {
    const r = calcAll({ ...BASE_INPUTS, occ: 0 });
    expect(r.grossRevenue).toBe(0);
    expect(r.airbnbFee).toBe(0);
    expect(r.netMonthly).toBeCloseTo(-r.fixed, 4);
  });

  it('isHOA flag does not affect arithmetic results', () => {
    const withHOA = calcAll({ ...BASE_INPUTS, isHOA: true });
    const without = calcAll({ ...BASE_INPUTS, isHOA: false });
    expect(withHOA.netMonthly).toBeCloseTo(without.netMonthly, 4);
    expect(withHOA.roi12).toBeCloseTo(without.roi12, 4);
  });

  it('returns 3 scenario rows', () => {
    const r = calcAll(BASE_INPUTS);
    expect(r.scenarioData).toHaveLength(3);
  });

  it('margin is zero when gross revenue is zero', () => {
    const r = calcAll({ ...BASE_INPUTS, adr: 0 });
    expect(r.margin).toBe(0);
  });

  it('multiple is zero when rentNeg is zero', () => {
    const r = calcAll({ ...BASE_INPUTS, rentNeg: 0 });
    expect(r.multiple).toBe(0);
  });

  it('clamps avgStay to 0.1 to avoid division by zero', () => {
    expect(() => calcAll({ ...BASE_INPUTS, avgStay: 0 })).not.toThrow();
    const r = calcAll({ ...BASE_INPUTS, avgStay: 0 });
    expect(isFinite(r.staysPerMonth)).toBe(true);
  });
});

// ── getScenariosData ──────────────────────────────────────────────────────────

describe('getScenariosData', () => {
  it('returns rows labeled best, base, worst in that order', () => {
    const rows = getScenariosData(167, 77, 1819);
    expect(rows.map(r => r.label)).toEqual(['best', 'base', 'worst']);
  });

  it('base row net matches calcAll result', () => {
    const r = calcAll(BASE_INPUTS);
    const [, base] = getScenariosData(BASE_INPUTS.adr, BASE_INPUTS.occ, r.fixed);
    expect(base.netMonthly).toBeCloseTo(r.netMonthly, 1);
  });

  it('best row has higher netMonthly than base, worst has lower', () => {
    const rows = getScenariosData(167, 77, 1819);
    expect(rows[0].netMonthly).toBeGreaterThan(rows[1].netMonthly);
    expect(rows[2].netMonthly).toBeLessThan(rows[1].netMonthly);
  });

  it('caps best-case occupancy at the 95% practical ceiling', () => {
    // occ = 88 + 15 delta = 103 would exceed 100% without the cap
    const rows = getScenariosData(167, 88, 1819);
    expect(rows[0].occ).toBe(95);
    const expectedGross = rows[0].adr * 0.95 * 30;
    expect(rows[0].netMonthly).toBeCloseTo(expectedGross * (1 - 0.03) - 1819, 0);
  });

  it('never renders occupancy above 95 for any scenario', () => {
    const rows = getScenariosData(167, 100, 1819);
    rows.forEach(row => expect(row.occ).toBeLessThanOrEqual(95));
  });
});

// ── getRiskFlags ──────────────────────────────────────────────────────────────

describe('getRiskFlags', () => {
  it('returns no flags for clean base case inputs', () => {
    const r = calcAll(BASE_INPUTS);
    const flags = getRiskFlags(BASE_INPUTS, r);
    expect(flags).toHaveLength(0);
  });

  it('emits danger flag when isHOA is true', () => {
    const inputs = { ...BASE_INPUTS, isHOA: true };
    const flags = getRiskFlags(inputs, calcAll(inputs));
    expect(flags.some(f => f.type === 'danger' && f.text.includes('HOA'))).toBe(true);
  });

  it('emits warn flag when break-even occupancy exceeds 65%', () => {
    // Drive break-even high by lowering ADR relative to fixed costs
    const inputs = { ...BASE_INPUTS, adr: 60 };
    const r = calcAll(inputs);
    expect(r.breakEvenOcc).toBeGreaterThan(65);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.type === 'warn' && f.text.includes('break-even'))).toBe(true);
  });

  it('does not emit break-even flag when occupancy required is at or below 65%', () => {
    const inputs = { ...BASE_INPUTS, adr: 300 };
    const r = calcAll(inputs);
    expect(r.breakEvenOcc).toBeLessThanOrEqual(65);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('break-even'))).toBe(false);
  });

  it('emits danger flag when worst-case scenario is cash-flow negative', () => {
    const inputs = { ...BASE_INPUTS, adr: 60, rentNeg: 1700 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.type === 'danger' && f.text.includes('negative'))).toBe(true);
  });

  it('emits warn flag when revenue multiple is below 1.8', () => {
    // With adr=60 and occ=77, gross ≈ $1,386 / rentNeg=$1,200 → multiple ≈ 1.155
    const inputs = { ...BASE_INPUTS, adr: 60 };
    const r = calcAll(inputs);
    expect(r.multiple).toBeLessThan(1.8);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('multiple'))).toBe(true);
  });

  it('does not emit multiple flag when multiple is at or above 1.8', () => {
    const inputs = { ...BASE_INPUTS, adr: 167, rentNeg: 500 };
    const r = calcAll(inputs);
    expect(r.multiple).toBeGreaterThanOrEqual(1.8);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('multiple'))).toBe(false);
  });

  it('emits warn flag when rentNeg exceeds $1,750', () => {
    const inputs = { ...BASE_INPUTS, rentNeg: 1800 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('$1,750'))).toBe(true);
  });

  it('does not emit rent-threshold flag when rentNeg is exactly $1,750', () => {
    const inputs = { ...BASE_INPUTS, rentNeg: 1750 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('$1,750'))).toBe(false);
  });

  it('emits warn flag when avgStay is below 2 nights', () => {
    const inputs = { ...BASE_INPUTS, avgStay: 1.5 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('short avg stay'))).toBe(true);
  });

  it('does not emit short-stay flag when avgStay is exactly 2', () => {
    const inputs = { ...BASE_INPUTS, avgStay: 2 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.text.includes('short avg stay'))).toBe(false);
  });

  it('can emit multiple flags simultaneously', () => {
    const inputs = { ...BASE_INPUTS, isHOA: true, rentNeg: 1800, avgStay: 1 };
    const r = calcAll(inputs);
    const flags = getRiskFlags(inputs, r);
    expect(flags.length).toBeGreaterThanOrEqual(2);
  });

  it('fires the Marginal flag when rent is 34.2% of gross revenue', () => {
    // ADR 166 × 88% × 30 = $4,382 gross; rent $1,500 → 34.2%
    const inputs = { ...BASE_INPUTS, rentNeg: 1500, adr: 166, occ: 88 };
    const r = calcAll(inputs);
    expect((inputs.rentNeg / r.grossRevenue) * 100).toBeCloseTo(34.2, 1);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.type === 'warn' && f.text.startsWith('Marginal'))).toBe(true);
    expect(flags.some(f => f.text.startsWith('Walk'))).toBe(false);
  });

  it('fires the Walk flag when rent is 46% of gross revenue', () => {
    const inputs = { ...BASE_INPUTS, rentNeg: 2016, adr: 166, occ: 88 };
    const r = calcAll(inputs);
    expect((inputs.rentNeg / r.grossRevenue) * 100).toBeCloseTo(46.0, 1);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.type === 'danger' && f.text.startsWith('Walk'))).toBe(true);
    expect(flags.some(f => f.text.startsWith('Marginal'))).toBe(false);
  });

  it('does not fire rent-to-gross flags at or below 33%', () => {
    // ADR 167 × 77% × 30 = $3,858 gross; rent $1,200 → 31.1%
    const r = calcAll(BASE_INPUTS);
    const flags = getRiskFlags(BASE_INPUTS, r);
    expect(flags.some(f => f.text.startsWith('Marginal') || f.text.startsWith('Walk'))).toBe(false);
  });

  it('fires the payback-rule flag when ramped payback exceeds the rule', () => {
    const inputs = { ...BASE_INPUTS, furniture: 20000 };
    const r = calcAll(inputs, defaultRampSettings());
    expect(r.paybackRamped!).toBeGreaterThan(9);
    const flags = getRiskFlags(inputs, r, 9);
    expect(flags.some(f => f.type === 'danger' && f.text.includes('9-month rule'))).toBe(true);
  });

  it('fires an info flag when the occupancy input was capped', () => {
    const inputs = { ...BASE_INPUTS, occ: 103 };
    const r = calcAll(inputs);
    expect(r.occCapped).toBe(true);
    const flags = getRiskFlags(inputs, r);
    expect(flags.some(f => f.type === 'info' && f.text.includes('capped at 95%'))).toBe(true);
  });
});

// ── capOcc / occupancy ceiling ────────────────────────────────────────────────

describe('capOcc', () => {
  it('caps values above 95 and passes lower values through', () => {
    expect(capOcc(103)).toBe(OCC_CAP);
    expect(capOcc(95)).toBe(95);
    expect(capOcc(77)).toBe(77);
  });

  it('calcAll computes revenue from the capped occupancy', () => {
    const capped = calcAll({ ...BASE_INPUTS, occ: 103 });
    const at95   = calcAll({ ...BASE_INPUTS, occ: 95 });
    expect(capped.grossRevenue).toBeCloseTo(at95.grossRevenue, 4);
    expect(capped.occCapped).toBe(true);
    expect(at95.occCapped).toBe(false);
  });
});

// ── Break-even occupancy (fee-adjusted) ───────────────────────────────────────

describe('breakEvenOcc', () => {
  it('matches the fee-adjusted formula: $2,541 fixed, $166 ADR, 3% fee → ≈52.6%', () => {
    // Fixture engineered so calcFixedCosts totals exactly $2,541
    const inputs: AnalysisInputs = {
      ...BASE_INPUTS,
      rentNeg: 1500, adr: 166, occ: 88, utilities: 0,
      electricity: 130, water: 45, sewer: 50, garbage: 24, internet: 80,
      insurance: 100, supplies: 266, linens: 41,
      pms: 39, pricing: 20, minutSubscription: 10, streaming: 8,
      pestControl: 51, preventiveInspection: 50, hvacFilters: 10, cpa: 42,
    };
    const r = calcAll(inputs);
    expect(r.fixed).toBeCloseTo(2541, 4);
    expect(r.breakEvenOcc).toBeCloseTo(2541 / (166 * 30 * 0.97) * 100, 1); // ≈ 52.6
    expect(r.breakEvenOcc).toBeCloseTo(52.6, 1);
  });
});

// ── Ramp mode ─────────────────────────────────────────────────────────────────

// Encino regression fixture: rent $1,500, ADR $166, occ 88%, fixed $2,541,
// one-time investment $13,350 (+ month-1 carry).
const ENCINO_INPUTS: AnalysisInputs = {
  ...BASE_INPUTS,
  rentNeg: 1500, adr: 166, occ: 88, utilities: 0,
  electricity: 130, water: 45, sewer: 50, garbage: 24, internet: 80,
  insurance: 100, supplies: 266, linens: 41,
  pms: 39, pricing: 20, minutSubscription: 10, streaming: 8,
  pestControl: 51, preventiveInspection: 50, hvacFilters: 10, cpa: 42,
  deposit: 13350, furniture: 0, photo: 0, lock: 0, legal: 0, misc: 0,
};

describe('calcMonth1Carry', () => {
  it('sums utilities, insurance, tech subscriptions, lawn care, and pest control', () => {
    const { total } = calcMonth1Carry(ENCINO_INPUTS, true);
    // 329 utilities + 100 insurance + 77 tech + 51 pest control
    expect(total).toBeCloseTo(557, 4);
  });

  it('excludes revenue- and occupancy-driven lines', () => {
    const { breakdown } = calcMonth1Carry(ENCINO_INPUTS, true);
    const labels = breakdown.map(b => b.label).join();
    expect(labels).not.toMatch(/Supplies|Linens|Maintenance|Inspection|HVAC|CPA|Airbnb|Cleaning/);
  });

  it('adds one month of rent when month 1 is not rent-free', () => {
    const rentFree = calcMonth1Carry(ENCINO_INPUTS, true);
    const notFree  = calcMonth1Carry(ENCINO_INPUTS, false);
    expect(notFree.total - rentFree.total).toBeCloseTo(ENCINO_INPUTS.rentNeg, 4);
  });

  it('includes lawn care only when the property has a yard', () => {
    const withYard = calcMonth1Carry({ ...ENCINO_INPUTS, hasYard: true, lawnCare: 78 }, true);
    const noYard   = calcMonth1Carry({ ...ENCINO_INPUTS, hasYard: false, lawnCare: 78 }, true);
    expect(withYard.total - noYard.total).toBeCloseTo(78, 4);
  });
});

describe('ramp mode (calcAll with RampSettings)', () => {
  it('includes month-1 carry in total initial investment', () => {
    const r = calcAll(ENCINO_INPUTS, defaultRampSettings());
    expect(r.month1Carry).toBeCloseTo(557, 4);
    expect(r.totalInvest).toBeCloseTo(13350 + 557, 4);
  });

  it('Encino regression: flat payback ≈ 8.2 months, ramped ≈ 12 months', () => {
    const r = calcAll(ENCINO_INPUTS, defaultRampSettings());
    expect(r.payback).toBeGreaterThan(7.8);
    expect(r.payback).toBeLessThan(8.5);
    expect(r.paybackRamped!).toBeGreaterThan(11.2);
    expect(r.paybackRamped!).toBeLessThan(12.5);
  });

  it('ramp off reproduces the legacy flat model', () => {
    const flat = calcAll(ENCINO_INPUTS);
    const rampOff = calcAll(ENCINO_INPUTS, { ...defaultRampSettings(), enabled: false });
    expect(rampOff.totalInvest).toBeCloseTo(13350, 4);
    expect(rampOff.paybackRamped).toBeNull();
    expect(rampOff.roi12).toBeCloseTo(flat.roi12, 4);
    expect(rampOff.month1Carry).toBe(0);
  });

  it('month 1 has zero operating cash when make-ready is on', () => {
    const nets = calcRampMonthlyNets(88, 166, defaultRampSettings(), 2541, 0.03);
    expect(nets).toHaveLength(24);
    expect(nets[0]).toBe(0);
  });

  it('phase nets recompute gross and fee per phase rather than scaling stabilized net', () => {
    const nets = calcRampMonthlyNets(88, 166, defaultRampSettings(), 2541, 0.03);
    // Phase 1 (months 2–4): occ 88×0.85=74.8%, ADR 166×0.90=149.4
    const p1Gross = 149.4 * 0.748 * 30;
    expect(nets[1]).toBeCloseTo(p1Gross * 0.97 - 2541, 1);
    // Stabilized (month 8+) matches the flat monthly net
    const flatNet = 166 * 0.88 * 30 * 0.97 - 2541;
    expect(nets[8]).toBeCloseTo(flatNet, 1);
  });

  it('caps ramp-phase occupancy at 95 after applying the factor', () => {
    const ramp = defaultRampSettings();
    ramp.phases[0].occFactor = 1.5; // 88 × 1.5 = 132 → capped at 95
    const nets = calcRampMonthlyNets(88, 166, ramp, 2541, 0.03);
    const cappedGross = (166 * 0.90) * 0.95 * 30;
    expect(nets[1]).toBeCloseTo(cappedGross * 0.97 - 2541, 1);
  });

  it('computes 12- and 24-month ROI from the ramped curve', () => {
    const ramp = defaultRampSettings();
    const r = calcAll(ENCINO_INPUTS, ramp);
    const nets = calcRampMonthlyNets(88, 166, ramp, r.fixed, 0.03);
    const sum12 = nets.slice(0, 12).reduce((s, n) => s + n, 0);
    expect(r.roi12).toBeCloseTo((sum12 / r.totalInvest) * 100, 2);
    const flat = calcAll(ENCINO_INPUTS, { ...ramp, enabled: false });
    expect(r.roi12).toBeLessThan(flat.roi12);
  });

  it('rent-free toggle changes the carry and both payback figures', () => {
    const rentFree = calcAll(ENCINO_INPUTS, defaultRampSettings());
    const notFree  = calcAll(ENCINO_INPUTS, { ...defaultRampSettings(), rentFreeMonth1: false });
    expect(notFree.month1Carry - rentFree.month1Carry).toBeCloseTo(1500, 4);
    expect(notFree.paybackRamped!).toBeGreaterThan(rentFree.paybackRamped!);
    expect(notFree.payback).toBeGreaterThan(rentFree.payback);
  });
});

// ── Ramp edge cases (post-review fixes) ──────────────────────────────────────

describe('ramp edge cases', () => {
  it('credits rent back to month 1 when rent-free without a make-ready month', () => {
    const ramp = { ...defaultRampSettings(), makeReadyMonth: false };
    const rentFree = calcAll(ENCINO_INPUTS, { ...ramp, rentFreeMonth1: true });
    const notFree  = calcAll(ENCINO_INPUTS, { ...ramp, rentFreeMonth1: false });
    expect(rentFree.rampMonthlyNets[0] - notFree.rampMonthlyNets[0]).toBeCloseTo(1500, 4);
    expect(rentFree.paybackRamped!).toBeLessThan(notFree.paybackRamped!);
  });

  it('omits zero-length phases from the ramp table rows', () => {
    const ramp = defaultRampSettings();
    ramp.phases[0].months = 0;
    const r = calcAll(ENCINO_INPUTS, ramp);
    expect(r.rampRows.some(row => row.phase.startsWith('Phase 1'))).toBe(false);
    expect(r.rampRows.some(row => /mo 2–1/.test(row.phase))).toBe(false);
  });

  it('expandRampFactors marks the make-ready month null and fills the horizon', () => {
    const f = expandRampFactors(defaultRampSettings(), 12);
    expect(f[0]).toBeNull();
    expect(f[1]!.occFactor).toBe(0.85);
    expect(f[4]!.occFactor).toBe(0.93);
    expect(f[7]!.occFactor).toBe(1);
    expect(f).toHaveLength(12);
  });
});
