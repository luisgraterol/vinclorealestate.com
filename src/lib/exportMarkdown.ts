import { fmt, fmtPct, fmtX } from '@lib/formatters';
import { calcAll } from '@lib/calculations';
import type { AnalysisInputs, AnalysisResults, RampSettings, RiskFlag } from '@lib/calculations';

export interface ExportMeta {
  name: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  notes: string;
  riskFlags: RiskFlag[];
}

function fmtMonths(v: number | null): string {
  return v != null && isFinite(v) ? v.toFixed(1) + ' months' : '—';
}

// Ramp table (phase, occ, ADR, gross/mo, net/mo) — empty string when ramp off.
function rampSection(r: AnalysisResults): string {
  if (!r.rampEnabled || !r.rampRows.length) return '';
  const rows = r.rampRows.map(row =>
    `| ${row.phase} | ${fmtPct(row.occ)} | ${fmt(row.adr)} | ${fmt(row.gross)} | ${fmt(row.net)} |`
  ).join('\n');
  return `
## New-Listing Ramp
| Phase | Occ | ADR | Gross/mo | Net/mo |
|-------|-----|-----|----------|--------|
${rows}
`;
}

// 2×2 payback sensitivity: rent (entered / entered − $100) × furniture
// (entered / lean $5,500), ramped payback per cell, ✓/✗ vs the payback rule.
function sensitivitySection(
  inputs: AnalysisInputs,
  ramp: RampSettings,
): string {
  const rents = [inputs.rentNeg, inputs.rentNeg - 100];
  const furnitures = [inputs.furniture, 5500];
  const cell = (rentNeg: number, furniture: number) => {
    const res = calcAll({ ...inputs, rentNeg, furniture }, ramp);
    const p = res.paybackRamped ?? res.payback;
    const mark = isFinite(p) && p <= ramp.paybackRuleMonths ? '✓' : '✗';
    return `${fmtMonths(p)} ${mark}`;
  };
  return `
## Payback Sensitivity (ramped, ✓/✗ vs ${ramp.paybackRuleMonths}-month rule)
| Rent \\ Furniture | ${fmt(furnitures[0])} (entered) | ${fmt(furnitures[1])} (lean) |
|---|---|---|
| ${fmt(rents[0])} (entered) | ${cell(rents[0], furnitures[0])} | ${cell(rents[0], furnitures[1])} |
| ${fmt(rents[1])} (− $100) | ${cell(rents[1], furnitures[0])} | ${cell(rents[1], furnitures[1])} |
`;
}

export function exportMarkdown(
  inputs: AnalysisInputs,
  r: AnalysisResults,
  meta: ExportMeta,
  ramp?: RampSettings,
): void {
  const name = meta.name || 'New Analysis';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const flagLines = meta.riskFlags.map(f => `- ${f.icon} ${f.text}`);

  const mdTotalCosts  = r.airbnbFee + r.fixed;
  const mdStays       = r.staysPerMonth;
  const mdClean       = mdStays * inputs.cleaning;
  const airbnbFeeLabel = inputs.airbnbFeeType === '15.5%' ? '15.5% (Hospitable API)' : '3% (Direct)';
  const lawnVal = inputs.hasYard ? inputs.lawnCare : 0;

  const md = `# Property Analysis — ${name}
**R&L Capital Realty LLC** | Abilene, TX | Generated: ${date}

## Property Details
- Address: ${meta.address || 'N/A'}
- Bedrooms: ${meta.bedrooms} | Bathrooms: ${meta.bathrooms}
- Property Type: ${meta.propertyType}
- Negotiated Rent: ${fmt(inputs.rentNeg)}

## Revenue Assumptions
- ADR: ${fmt(inputs.adr)} | Occupancy: ${inputs.occ}% | Avg Stay: ${inputs.avgStay} nights
- Estimated stays/month: ${mdStays.toFixed(1)}

## Monthly P&L — Base Case
| Metric | Amount |
|--------|--------|
| Gross Revenue | ${fmt(r.grossRevenue)} |
| **Monthly Costs** | |
| Rent | ${fmt(inputs.rentNeg)} |
| *Utilities* | |
| Electricity | ${fmt(inputs.electricity)} |
| Water | ${fmt(inputs.water)} |
| Sewer | ${fmt(inputs.sewer)} |
| Garbage | ${fmt(inputs.garbage)} |
| Internet | ${fmt(inputs.internet)} |
| STR Insurance (Proper) | ${fmt(inputs.insurance)} |
| *Supplies* | |
| Supplies & Amenities | ${fmt(inputs.supplies)} |
| Linens & Towels | ${fmt(inputs.linens)} |
| *Tech & Platforms* | |
| Hospitable PMS | ${fmt(inputs.pms)} |
| PriceLabs | ${fmt(inputs.pricing)} |
| Minut Subscription | ${fmt(inputs.minutSubscription)} |
| Streaming | ${fmt(inputs.streaming)} |
| *Property Services* | |
| Lawn Care | ${fmt(lawnVal)} |
| Pest Control | ${fmt(inputs.pestControl)} |
| Bulk Pickup | ${fmt(inputs.bulkPickup)} |
| *Maintenance & Admin* | |
| Maintenance Reserve | ${fmt(r.maintenance)} |
| Preventive Inspection | ${fmt(inputs.preventiveInspection)} |
| HVAC Filters | ${fmt(inputs.hvacFilters)} |
| CPA / Taxes | ${fmt(inputs.cpa)} |
| Airbnb Fee (${airbnbFeeLabel}) | ${fmt(r.airbnbFee)} |
| STR Permit | $0 |
| **Total Costs** | **${fmt(mdTotalCosts)}** |
| Net Monthly Profit | ${fmt(r.netMonthly)} |
| Net Annual Profit | ${fmt(r.netAnnual)} |
| Break-Even Occupancy | ${fmtPct(r.breakEvenOcc)} |
| Margin % | ${fmtPct(r.margin)} |
| Rent-to-Revenue Multiple | ${fmtX(r.multiple)} |

## Cleaning — Pass-Through
| | |
|-|-|
| Stays / Month | ${mdStays.toFixed(1)} |
| Cleaning Collected (from guest) | ${fmt(mdClean)} |
| Cleaning Paid (to cleaner) | ${fmt(mdClean)} |
| Net P&L Impact | $0 |

## Scenario Analysis
| Scenario | Occ% | ADR | Net/mo | Net/yr |
|----------|------|-----|--------|--------|
${r.scenarioData.map(s => `| ${s.label.charAt(0).toUpperCase() + s.label.slice(1)} | ${fmtPct(s.occ)} | ${fmt(s.adr)} | ${fmt(s.netMonthly)} | ${fmt(s.netAnnual)} |`).join('\n')}
${rampSection(r)}
## Investment Summary
| Item | Amount |
|------|--------|
| Security Deposit | ${fmt(inputs.deposit)} |
| Furniture & Décor | ${fmt(inputs.furniture)} |
| Photography | ${fmt(inputs.photo)} |
| Smart Lock | ${fmt(inputs.lock)} |
| Minut Hardware | ${fmt(inputs.minutHardware)} |
| WiFi Router | ${fmt(inputs.wifiRouter)} |
| Welcome Kits | ${fmt(inputs.welcomeKits)} |
| Legal | ${fmt(inputs.legal)} |
| Miscellaneous | ${fmt(inputs.misc)} |
${r.rampEnabled ? `| Month-1 Carry (${r.carryBreakdown.map(c => c.label).join(', ')}) | ${fmt(r.month1Carry)} |\n` : ''}| **Total Initial Investment** | **${fmt(r.totalInvest)}** |

| Metric | Value |
|--------|-------|
${r.rampEnabled && r.paybackRamped != null
  ? `| **Payback (ramped — realistic)** | **${fmtMonths(r.paybackRamped)}** |\n| Payback (flat base case — assumes day-1 stabilization, optimistic) | ${fmtMonths(r.payback)} |`
  : `| Payback Period | ${fmtMonths(r.payback)} |`}
| 12-Month ROI | ${fmtPct(r.roi12)} |
| 24-Month ROI | ${fmtPct(r.roi24)} |
${ramp && r.rampEnabled ? sensitivitySection(inputs, ramp) : ''}
## Risk Assessment
${flagLines.length ? flagLines.join('\n') : 'No risk flags triggered.'}

## Abilene Market Notes
- STR permit: Not required (City of Abilene, 2026)
- HOT tax: Collected and remitted by Airbnb — no operator action required
- Primary demand driver: Dyess Air Force Base (TDY military) + ACU / Hardin-Simmons / McMurry
- Insurance: Proper Insurance STR policy (~$98–103/mo), landlord named as additional insured
- Sublease: Requires explicit addendum — Texas RE attorney review recommended (~$400)

## Notes
${meta.notes || 'None.'}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  const ts   = new Date();
  const pad  = (n: number) => String(n).padStart(2, '0');
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
  a.download = (name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'analysis') + '-' + stamp + '.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
