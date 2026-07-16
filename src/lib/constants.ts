// Shared thresholds for the property analyzer.
// Single source of truth imported by both the calculator (risk flags) and the
// 1/3 Rule Validator so their verdicts can never disagree.

// Rent as a share of gross revenue: healthy up to 33%, walk away above 45%.
export const RENT_TO_GROSS_HEALTHY_MAX = 0.33;
export const RENT_TO_GROSS_WALK = 0.45;

// R&L payback rule: ramped payback beyond this many months fails the deal.
// Default only — editable per analysis in the calculator settings.
export const PAYBACK_RULE_MONTHS = 9;

// Cap is 95, not 100: with a ~3.2-night average stay, turnover gaps between
// checkout and check-in make some nights unsellable, so 100% occupancy is not
// achievable in practice.
export const OCC_CAP = 95;

// Caps an occupancy percentage [0–100] at the practical ceiling.
export function capOcc(occ: number): number {
  return Math.min(occ, OCC_CAP);
}
