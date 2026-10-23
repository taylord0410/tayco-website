export const CONTRACT_TYPE_OPTIONS = [
  { value: 'unknown', label: 'Unknown / not reviewed' },
  { value: 'private', label: 'Private' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'Local' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'mixed', label: 'Mixed' },
] as const;
export const FUNDING_TYPE_OPTIONS = [
  { value: 'unknown', label: 'Unknown / not reviewed' },
  { value: 'private', label: 'Private' },
  { value: 'federal', label: 'Federal' },
  { value: 'state_local', label: 'State / local' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'mixed', label: 'Mixed' },
] as const;
export const LABOR_REGIME_OPTIONS = [
  { value: 'unknown', label: 'Unknown / not reviewed' },
  { value: 'union', label: 'Union' },
  { value: 'non_union', label: 'Non-union' },
  { value: 'mixed', label: 'Mixed' },
] as const;
export const COMPLIANCE_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'contract', label: 'Contract' },
  { value: 'license', label: 'License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'bond', label: 'Bond' },
  { value: 'prevailing_wage', label: 'Prevailing wage' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'labor_agreement', label: 'Labor agreement' },
  { value: 'safety', label: 'Safety' },
  { value: 'tax', label: 'Tax' },
  { value: 'tribal', label: 'Tribal' },
] as const;

export type ContractType = typeof CONTRACT_TYPE_OPTIONS[number]['value'];
export type FundingType = typeof FUNDING_TYPE_OPTIONS[number]['value'];
export type LaborRegime = typeof LABOR_REGIME_OPTIONS[number]['value'];
export type ComplianceCategory = typeof COMPLIANCE_CATEGORY_OPTIONS[number]['value'];
export type ProjectClassificationFields = {
  contractType: ContractType;
  fundingType: FundingType;
  laborRegime: LaborRegime;
  jurisdiction: string;
  source: string;
};
export type ProjectClassificationReview = ProjectClassificationFields & {
  reviewedAt: string;
  reviewedBy: string;
};
export type ProjectClassification = ProjectClassificationFields & {
  reviewedAt: string | null;
  reviewedBy: string | null;
  history: ProjectClassificationReview[];
};
export const CLASSIFICATION_HISTORY_LIMIT = 100;
export const CLASSIFICATION_JURISDICTION_MAX = 200;
export const CLASSIFICATION_SOURCE_MAX = 1000;

type Option = { readonly value: string; readonly label: string };
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function knownValue<T extends string>(value: unknown, options: readonly Option[], fallback: T): T {
  return typeof value === 'string' && options.some(option => option.value === value) ? value as T : fallback;
}
function boundedText(value: unknown, max: number): string {
  return typeof value === 'string' && value.length <= max ? value.trim() : '';
}
function readFields(value: unknown): ProjectClassificationFields {
  const data = record(value);
  return {
    contractType: knownValue<ContractType>(data.contractType, CONTRACT_TYPE_OPTIONS, 'unknown'),
    fundingType: knownValue<FundingType>(data.fundingType, FUNDING_TYPE_OPTIONS, 'unknown'),
    laborRegime: knownValue<LaborRegime>(data.laborRegime, LABOR_REGIME_OPTIONS, 'unknown'),
    jurisdiction: boundedText(data.jurisdiction, CLASSIFICATION_JURISDICTION_MAX),
    source: boundedText(data.source, CLASSIFICATION_SOURCE_MAX),
  };
}
function timestamp(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
}

/** Presentation only: missing/unsupported legacy fields stay unknown; this never modifies a source. */
export function readProjectClassification(value: unknown): ProjectClassification {
  const data = record(value);
  const history = (Array.isArray(data.history) ? data.history : []).slice(-CLASSIFICATION_HISTORY_LIMIT).flatMap(value => {
    const item = record(value), reviewedAt = timestamp(item.reviewedAt), reviewedBy = boundedText(item.reviewedBy, 100);
    return reviewedAt && reviewedBy ? [{ ...readFields(item), reviewedAt, reviewedBy }] : [];
  });
  return { ...readFields(data), reviewedAt: timestamp(data.reviewedAt), reviewedBy: boundedText(data.reviewedBy, 100) || null, history };
}

/** Validates explicit user declarations only; no legal applicability is inferred from these axes. */
export function parseProjectClassificationInput(input: Record<string, unknown>): ProjectClassificationFields {
  const axis = <T extends string>(value: unknown, options: readonly Option[], label: string): T => {
    if (value === undefined) return 'unknown' as T;
    if (typeof value !== 'string' || !options.some(option => option.value === value)) throw new Error('Choose a valid ' + label + '.');
    return value as T;
  };
  const field = (value: unknown, max: number, label: string) => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.length > max) throw new Error('Check ' + label + '.');
    return value.trim();
  };
  const result = {
    contractType: axis<ContractType>(input.contractType, CONTRACT_TYPE_OPTIONS, 'contract type'),
    fundingType: axis<FundingType>(input.fundingType, FUNDING_TYPE_OPTIONS, 'funding type'),
    laborRegime: axis<LaborRegime>(input.laborRegime, LABOR_REGIME_OPTIONS, 'labor regime'),
    jurisdiction: field(input.jurisdiction, CLASSIFICATION_JURISDICTION_MAX, 'classification jurisdiction'),
    source: field(input.classificationSource, CLASSIFICATION_SOURCE_MAX, 'classification source'),
  };
  if ((result.contractType !== 'unknown' || result.fundingType !== 'unknown' || result.laborRegime !== 'unknown' || result.jurisdiction) && !result.source) {
    throw new Error('Provide a classification source for every known classification or jurisdiction.');
  }
  return result;
}

export function readComplianceCategory(value: unknown): ComplianceCategory {
  return knownValue<ComplianceCategory>(value, COMPLIANCE_CATEGORY_OPTIONS, 'general');
}
