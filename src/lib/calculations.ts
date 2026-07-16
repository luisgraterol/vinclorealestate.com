import {
  capOcc,
  OCC_CAP,
  PAYBACK_RULE_MONTHS,
  RENT_TO_GROSS_HEALTHY_MAX,
  RENT_TO_GROSS_WALK,
} from '@lib/constants';

export interface AnalysisInputs {
  rentNeg: number;
  rentAsk: number;
  deposit: number;
  adr: number;
  occ: number; // 0–100
  avgStay: number;
  cleaning: number;
  // Legacy combined field — kept for backward compat; new analyses set to 0
  utilities: number;
  // Utility breakdown (replaces utilities)
  electricity: number;
  water: number;
  sewer: number;
  garbage: number;
  internet: number;
  insurance: number;
  supplies: number;
  linens: number;
  pms: number;
  pricing: number;
  // Tech & platforms
  minutSubscription: number;
  streaming: number;
  airbnbFeeType: '3%' | '15.5%';
  // Property services
  hasYard: boolean;
  lawnCare: number;
  pestControl: number;
  bulkPickup: number;
  // Maintenance & admin
  preventiveInspection: number;
  hvacFilters: number;
  cpa: number;
  // One-time setup
  furniture: number;
  photo: number;
  lock: number;
  legal: number;
  misc: number;
  minutHardware: number;
  wifiRouter: number;
  welcomeKits: number;
  isHOA: boolean;
}

export interface RampPhase {
  months: number; // Infinity = runs until the end of the horizon (stabilized)
  occFactor: number; // relative multiplier on base occupancy
  adrFactor: number; // relative multiplier on base ADR
}

export interface RampSettings {
  enabled: boolean;
  makeReadyMonth: boolean; // month 1 has zero revenue (setup, photos, go-live)
  rentFreeMonth1: boolean; // negotiated deal includes month 1 rent-free
  paybackRuleMonths: number;
  phases: RampPhase[];
}

export function defaultRampSettings(): RampSettings {
  return {
    enabled: true,
    makeReadyMonth: true,
    rentFreeMonth1: true,
    paybackRuleMonths: PAYBACK_RULE_MONTHS,
    phases: [
      { months: 3, occFactor: 0.85, adrFactor: 0.90 },
      { months: 3, occFactor: 0.93, adrFactor: 0.96 },
      { months: Infinity, occFactor: 1, adrFactor: 1 },
    ],
  };
}

export interface CarryItem {
  label: string;
  amount: number;
}

export interface RampRow {
  phase: string;
  occ: number; // effective occupancy %, capped
  adr: number;
  gross: number;
  net: number;
}

export interface AnalysisResults {
  grossRevenue: number;
  airbnbFee: number;
  netPlatform: number;
  fixed: number;
  maintenance: number;
  staysPerMonth: number;
  netMonthly: number;
  netAnnual: number;
  breakEvenOcc: number;
  margin: number;
  multiple: number;
  totalInvest: number;
  payback: number;
  roi12: number;
  roi24: number;
  scenarioData: ScenarioRow[];
  // Ramp mode
  rampEnabled: boolean;
  occCapped: boolean;
  month1Carry: number;
  carryBreakdown: CarryItem[];
  paybackRamped: number | null; // null when ramp mode is off
  rampRows: RampRow[];
  rampMonthlyNets: number[]; // operating net for months 1–24; empty when ramp off
}

export interface ScenarioRow {
  label: 'best' | 'base' | 'worst';
  occ: number;
  adr: number;
  netMonthly: number;
  netAnnual: number;
}

export interface RiskFlag {
  type: 'ok' | 'info' | 'warn' | 'danger';
  icon: string;
  text: string;
}

export function calcMaintenance(rentNeg: number): number {
  return Math.min(Math.max(rentNeg * 0.015, 75), 150);
}

export function calcFixedCosts(inputs: AnalysisInputs): number {
  const maintenance = calcMaintenance(inputs.rentNeg);
  const yardCosts = inputs.hasYard ? inputs.lawnCare : 0;
  return (
    inputs.rentNeg +
    inputs.utilities +
    inputs.electricity +
    inputs.water +
    inputs.sewer +
    inputs.garbage +
    inputs.internet +
    inputs.insurance +
    inputs.supplies +
    inputs.linens +
    inputs.pms +
    inputs.pricing +
    inputs.minutSubscription +
    inputs.streaming +
    yardCosts +
    inputs.pestControl +
    inputs.bulkPickup +
    inputs.preventiveInspection +
    inputs.hvacFilters +
    inputs.cpa +
    maintenance
  );
}

// Non-rent fixed monthly costs that keep running during the make-ready month
// (no revenue yet). Excludes revenue-/occupancy-driven lines: supplies, linens,
// maintenance reserve, preventive inspection, HVAC filters, CPA, Airbnb fee,
// cleaning. Adds one month of rent when the deal is NOT month-1 rent-free.
export function calcMonth1Carry(
  inputs: AnalysisInputs,
  rentFreeMonth1: boolean,
): { total: number; breakdown: CarryItem[] } {
  const breakdown: CarryItem[] = [
    { label: 'Utilities (legacy combined)', amount: inputs.utilities },
    { label: 'Electricity', amount: inputs.electricity },
    { label: 'Water', amount: inputs.water },
    { label: 'Sewer', amount: inputs.sewer },
    { label: 'Garbage', amount: inputs.garbage },
    { label: 'Internet', amount: inputs.internet },
    { label: 'STR Insurance', amount: inputs.insurance },
    { label: 'Hospitable PMS', amount: inputs.pms },
    { label: 'PriceLabs', amount: inputs.pricing },
    { label: 'Minut Subscription', amount: inputs.minutSubscription },
    { label: 'Streaming', amount: inputs.streaming },
    { label: 'Lawn Care', amount: inputs.hasYard ? inputs.lawnCare : 0 },
    { label: 'Pest Control', amount: inputs.pestControl },
  ];
  if (!rentFreeMonth1) {
    breakdown.unshift({ label: 'Rent (month 1 not rent-free)', amount: inputs.rentNeg });
  }
  const items = breakdown.filter(i => i.amount > 0);
  return { total: items.reduce((s, i) => s + i.amount, 0), breakdown: items };
}

// Operating net for one ramp phase: gross, Airbnb fee, and revenue-driven
// costs are recomputed from the phase's effective occ/ADR — not scaled from
// the stabilized net. (Cleaning is a guest pass-through with $0 P&L impact.)
function phaseNet(
  baseOccPct: number,
  baseAdr: number,
  phase: RampPhase,
  fixed: number,
  airbnbRate: number,
): { occ: number; adr: number; gross: number; net: number } {
  const occ = capOcc(baseOccPct * phase.occFactor);
  const adr = baseAdr * phase.adrFactor;
  const gross = adr * (occ / 100) * 30;
  const net = gross * (1 - airbnbRate) - fixed;
  return { occ, adr, gross, net };
}

// Expands ramp settings into one entry per month for months 1..horizon:
// null = make-ready month (zero revenue), otherwise the phase in effect.
// Phases past the configured ones extend with the last phase.
export function expandRampFactors(ramp: RampSettings, horizon = 24): Array<RampPhase | null> {
  const out: Array<RampPhase | null> = [];
  if (ramp.makeReadyMonth) out.push(null);
  for (const phase of ramp.phases) {
    const count = isFinite(phase.months) ? phase.months : horizon - out.length;
    for (let i = 0; i < count && out.length < horizon; i++) out.push(phase);
    if (out.length >= horizon) break;
  }
  const last = ramp.phases[ramp.phases.length - 1] ?? { months: Infinity, occFactor: 1, adrFactor: 1 };
  while (out.length < horizon) out.push(last);
  return out;
}

// Month-by-month operating nets under ramp mode, months 1..horizon.
// Month 1 is zero-revenue/zero-cost when makeReadyMonth is on (its carry costs
// are capitalized into the initial investment); phases run from then on, with
// the last phase covering the remainder of the horizon.
export function calcRampMonthlyNets(
  baseOccPct: number,
  baseAdr: number,
  ramp: RampSettings,
  fixed: number,
  airbnbRate: number,
  horizon = 24,
): number[] {
  return expandRampFactors(ramp, horizon).map(phase =>
    phase ? phaseNet(baseOccPct, baseAdr, phase, fixed, airbnbRate).net : 0,
  );
}

// Fractional payback month from a monthly-net curve starting at −totalInvest.
function paybackFromCurve(totalInvest: number, nets: number[], stabilizedNet: number): number {
  let cum = -totalInvest;
  for (let m = 1; m <= 600; m++) {
    const net = m <= nets.length ? nets[m - 1] : stabilizedNet;
    if (cum + net >= 0 && net > 0) return m - 1 + -cum / net;
    cum += net;
  }
  return Infinity;
}

export function calcAll(inputs: AnalysisInputs, ramp?: RampSettings): AnalysisResults {
  const occCapped = inputs.occ > OCC_CAP;
  const occPct = capOcc(inputs.occ);
  const occ = occPct / 100;
  const avgStay = Math.max(inputs.avgStay, 0.1);

  const maintenance = calcMaintenance(inputs.rentNeg);
  const fixed = calcFixedCosts(inputs);

  const airbnbRate = inputs.airbnbFeeType === '15.5%' ? 0.155 : 0.03;
  const grossRevenue = inputs.adr * occ * 30;
  const airbnbFee = grossRevenue * airbnbRate;
  const netPlatform = grossRevenue - airbnbFee;
  const staysPerMonth = (occ * 30) / avgStay;
  const netMonthly = netPlatform - fixed;
  const netAnnual = netMonthly * 12;
  // Fee-adjusted: the platform fee scales with gross, so break-even occupancy
  // must divide by the net-of-fee nightly revenue.
  const breakEvenOcc = fixed / (inputs.adr * 30 * (1 - airbnbRate)) * 100;
  const margin = grossRevenue > 0 ? (netMonthly / grossRevenue) * 100 : 0;
  const multiple = inputs.rentNeg > 0 ? grossRevenue / inputs.rentNeg : 0;

  const rampEnabled = ramp?.enabled ?? false;
  const carry = rampEnabled && ramp!.makeReadyMonth
    ? calcMonth1Carry(inputs, ramp!.rentFreeMonth1)
    : { total: 0, breakdown: [] as CarryItem[] };

  const totalInvest =
    inputs.deposit + inputs.furniture + inputs.photo +
    inputs.lock + inputs.legal + inputs.misc +
    inputs.minutHardware + inputs.wifiRouter + inputs.welcomeKits +
    carry.total;
  const payback = netMonthly > 0 ? totalInvest / netMonthly : Infinity;

  let roi12 = totalInvest > 0 ? (netAnnual / totalInvest) * 100 : 0;
  let roi24 = totalInvest > 0 ? ((netAnnual * 2) / totalInvest) * 100 : 0;

  let paybackRamped: number | null = null;
  let rampRows: RampRow[] = [];
  let rampMonthlyNets: number[] = [];
  if (rampEnabled && ramp) {
    rampMonthlyNets = calcRampMonthlyNets(occPct, inputs.adr, ramp, fixed, airbnbRate);
    // No make-ready month: month 1 operates normally, so a rent-free month 1
    // shows up as rent added back to that month's net (not as carry).
    if (!ramp.makeReadyMonth && ramp.rentFreeMonth1 && rampMonthlyNets.length) {
      rampMonthlyNets[0] += inputs.rentNeg;
    }
    paybackRamped = paybackFromCurve(totalInvest, rampMonthlyNets, netMonthly);
    if (totalInvest > 0) {
      roi12 = rampMonthlyNets.slice(0, 12).reduce((s, n) => s + n, 0) / totalInvest * 100;
      roi24 = rampMonthlyNets.slice(0, 24).reduce((s, n) => s + n, 0) / totalInvest * 100;
    }
    let startMonth = 1;
    if (ramp.makeReadyMonth) {
      rampRows.push({ phase: 'Make-ready (mo 1)', occ: 0, adr: 0, gross: 0, net: 0 });
      startMonth = 2;
    }
    ramp.phases.forEach((phase, i) => {
      if (phase.months <= 0) return; // zero-length phases contribute nothing
      const p = phaseNet(occPct, inputs.adr, phase, fixed, airbnbRate);
      const label = isFinite(phase.months)
        ? `Phase ${i + 1} (mo ${startMonth}–${startMonth + phase.months - 1})`
        : `Stabilized (mo ${startMonth}+)`;
      rampRows.push({ phase: label, occ: p.occ, adr: p.adr, gross: p.gross, net: p.net });
      startMonth += isFinite(phase.months) ? phase.months : 0;
    });
  }

  const scenarioData = getScenariosData(inputs.adr, occPct, fixed, airbnbRate);

  return {
    grossRevenue, airbnbFee, netPlatform, fixed, maintenance, staysPerMonth,
    netMonthly, netAnnual, breakEvenOcc, margin, multiple,
    totalInvest, payback, roi12, roi24, scenarioData,
    rampEnabled, occCapped,
    month1Carry: carry.total, carryBreakdown: carry.breakdown,
    paybackRamped, rampRows, rampMonthlyNets,
  };
}

export function getScenariosData(adr: number, occPct: number, fixed: number, airbnbRate = 0.03): ScenarioRow[] {
  const labels: Array<'best' | 'base' | 'worst'> = ['best', 'base', 'worst'];
  const dOccs = [15, 0, -15];
  const dAdrs = [0.15, 0, -0.15];

  return labels.map((label, i) => {
    const sOccPct = capOcc(Math.max(occPct + dOccs[i], 0));
    const sAdr = adr * (1 + dAdrs[i]);
    const sGross = sAdr * (sOccPct / 100) * 30;
    const sNet = sGross * (1 - airbnbRate) - fixed;
    return {
      label,
      occ: sOccPct,
      adr: sAdr,
      netMonthly: sNet,
      netAnnual: sNet * 12,
    };
  });
}

export function getRiskFlags(
  inputs: AnalysisInputs,
  results: AnalysisResults,
  paybackRuleMonths: number = PAYBACK_RULE_MONTHS,
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (inputs.isHOA) {
    flags.push({ type: 'danger', icon: '🔴', text: 'HOA detected — this property is disqualified.' });
  }

  const rentToGross = results.grossRevenue > 0 ? inputs.rentNeg / results.grossRevenue : 0;
  const rentToGrossPct = (rentToGross * 100).toFixed(1);
  if (rentToGross > RENT_TO_GROSS_WALK) {
    flags.push({
      type: 'danger', icon: '✗',
      text: `Walk — rent is ${rentToGrossPct}% of gross revenue (walk-away above ${Math.round(RENT_TO_GROSS_WALK * 100)}%).`,
    });
  } else if (rentToGross > RENT_TO_GROSS_HEALTHY_MAX) {
    flags.push({
      type: 'warn', icon: '⚠️',
      text: `Marginal — rent is ${rentToGrossPct}% of gross revenue (healthy ≤ ${Math.round(RENT_TO_GROSS_HEALTHY_MAX * 100)}%).`,
    });
  }

  if (results.paybackRamped != null && results.paybackRamped > paybackRuleMonths) {
    flags.push({
      type: 'danger', icon: '✗',
      text: isFinite(results.paybackRamped)
        ? `Ramped payback ${results.paybackRamped.toFixed(1)} months exceeds the ${paybackRuleMonths}-month rule.`
        : `Ramped payback never reached — exceeds the ${paybackRuleMonths}-month rule.`,
    });
  }

  if (results.occCapped) {
    flags.push({
      type: 'info', icon: 'ℹ️',
      text: `Occupancy input capped at ${OCC_CAP}% — practical ceiling (turnover gaps make some nights unsellable).`,
    });
  }
  if (inputs.airbnbFeeType === '15.5%') {
    const feeOnBase = Math.round(results.airbnbFee);
    flags.push({
      type: 'warn', icon: '⚠️',
      text: `Airbnb fee is set to 15.5% (Hospitable API). Fee on base-case gross is ~$${feeOnBase}/mo — confirm in Airbnb → Payments & Payouts.`,
    });
  }
  if (results.breakEvenOcc > 65) {
    flags.push({ type: 'warn', icon: '⚠️', text: 'High break-even. Market avg is 77% — margin of safety is narrow.' });
  }

  const airbnbRate = inputs.airbnbFeeType === '15.5%' ? 0.155 : 0.03;
  const worstOcc = Math.max(capOcc(inputs.occ) - 15, 0) / 100;
  const worstAdr = inputs.adr * 0.85;
  const worstGross = worstAdr * worstOcc * 30;
  const worstNet = worstGross * (1 - airbnbRate) - results.fixed;
  if (worstNet < 0) {
    flags.push({
      type: 'danger', icon: '🔴',
      text: 'Worst-case scenario is cash-flow negative. Ensure 2–3 months cash reserve before signing.',
    });
  }

  if (results.multiple > 0 && results.multiple < 1.8) {
    flags.push({ type: 'warn', icon: '⚠️', text: 'Revenue multiple below 1.8x. Arbitrage margin is thin — renegotiate rent or pass.' });
  }
  if (inputs.rentNeg > 1750) {
    flags.push({ type: 'warn', icon: '⚠️', text: 'Rent exceeds R&L walk-away threshold of $1,750/mo for Abilene 3BR.' });
  }
  if (inputs.avgStay > 0 && inputs.avgStay < 2) {
    flags.push({ type: 'warn', icon: '⚠️', text: 'Very short avg stay increases cleaning coordination load significantly.' });
  }

  return flags;
}
