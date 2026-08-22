import {
  OnboardingSectionKey,
  OnboardingSectionStatus,
} from './constants/onboarding-section.constants';

type FormFieldBase = {
  key: string;
  label: string;
};

export type ReadonlyFormField = FormFieldBase & {
  type: 'readonly';
  value: string | number | boolean | null;
};

export type CheckboxOption = {
  id: string;
  label: string;
  meta?: Record<string, unknown>;
};

export type CheckboxGroupFormField = FormFieldBase & {
  type: 'checkbox_group';
  options: CheckboxOption[];
  selected: string[];
  required?: boolean;
};

export type MerchantDetailsFormField = ReadonlyFormField | CheckboxGroupFormField;

export type MerchantDetailsFormConfig = {
  clientId: string;
  onboardingType: string | null;
  sectionStatus: string;
  fields: MerchantDetailsFormField[];
  selectedProfile: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function isBlank(value: unknown): boolean {
  const text = asString(value).trim();
  return !text || /^(na|n\/a|null|none|-)$/i.test(text);
}

function labelize(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

const SKIP_PROFILE_KEYS = new Set([
  'gstFiling',
  'gstLiability',
  'filingFrequency',
  'filingFrequencyLastYear',
  'currentYear',
  'previousYear',
  'directors',
  'authorizedSignatories',
  'onboardingSteps',
  'confirmedFields',
]);

function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return isBlank(value) ? '' : value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join('\n');
  }
  const rec = asRecord(value);
  if (rec.hsnCode || rec.hsnDescription) {
    return [asString(rec.hsnCode), asString(rec.hsnDescription)]
      .filter(Boolean)
      .join(' — ');
  }
  if (rec.fullAddress) return asString(rec.fullAddress);
  const address = [
    rec.street_address,
    rec.street_address2,
    rec.locality,
    rec.city,
    rec.state,
    rec.postal_code,
  ]
    .map((part) => asString(part))
    .filter(Boolean)
    .join(', ');
  return address;
}

function collectOptions(
  value: unknown,
  path: string[],
  options: CheckboxOption[],
) {
  const leaf = path[path.length - 1] ?? '';
  if (leaf && SKIP_PROFILE_KEYS.has(leaf)) return;
  if (value == null) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const formatted = formatValue(item);
      if (!formatted) return;
      const rec = asRecord(item);
      const hint = asString(rec.address_type || rec.hsnCode || rec.fullName);
      options.push({
        id: [...path, String(index)].join('.'),
        label: hint
          ? `${labelize(leaf)} ${index + 1} · ${hint}: ${formatted}`
          : `${formatted}`,
        meta: typeof item === 'object' ? rec : { value: item },
      });
    });
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(asRecord(value))) {
      collectOptions(nested, [...path, key], options);
    }
    return;
  }

  const formatted = formatValue(value);
  if (!formatted) return;
  options.push({
    id: path.join('.'),
    label: `${labelize(leaf)}: ${formatted}`,
  });
}

function readonlyField(
  key: string,
  label: string,
  value: unknown,
): ReadonlyFormField {
  return {
    key,
    label,
    type: 'readonly',
    value:
      value === undefined || value === null
        ? null
        : typeof value === 'object'
          ? JSON.stringify(value)
          : (value as string | number | boolean),
  };
}

function checkboxField(
  key: string,
  label: string,
  options: CheckboxOption[],
  selected: string[],
  required = false,
): CheckboxGroupFormField {
  return {
    key,
    label,
    type: 'checkbox_group',
    options,
    selected,
    required,
  };
}

export function buildMerchantDetailsFormConfig(input: {
  clientId: string;
  onboardingType: string | null;
  sectionStatus: string;
  merchantProfile: Record<string, unknown>;
  selectedProfile: Record<string, unknown> | null;
}): MerchantDetailsFormConfig {
  const selected = input.selectedProfile ?? {};
  const confirmed = Array.isArray(selected.confirmedFields)
    ? (selected.confirmedFields as string[])
    : null;
  const fields: MerchantDetailsFormField[] = [];
  const activity = asRecord(input.merchantProfile.businessActivity);

  for (const [sectionKey, sectionVal] of Object.entries(input.merchantProfile)) {
    if (SKIP_PROFILE_KEYS.has(sectionKey) || sectionKey === 'businessActivity') {
      continue;
    }
    const options: CheckboxOption[] = [];
    collectOptions(sectionVal, [sectionKey], options);
    for (const option of options) {
      const leaf = option.id.split('.').pop() ?? option.label;
      fields.push(readonlyField(option.id, leaf, option.label.replace(/^[^:]+:\s*/, '')));
    }
  }

  const natureOptions: CheckboxOption[] = [];
  const hsnOptions: CheckboxOption[] = [];
  collectOptions(activity.natureOfBusiness, ['businessActivity', 'natureOfBusiness'], natureOptions);
  collectOptions(activity.hsnServices, ['businessActivity', 'hsnServices'], hsnOptions);

  if (natureOptions.length) {
    fields.push(
      checkboxField(
        'businessActivity.natureOfBusiness',
        'Nature of Business',
        natureOptions,
        confirmed
          ? natureOptions
              .map((option) => option.id)
              .filter((id) => confirmed.includes(id))
          : natureOptions.map((option) => option.id),
        true,
      ),
    );
  }

  if (hsnOptions.length) {
    fields.push(
      checkboxField(
        'businessActivity.hsnServices',
        'HSN / Services',
        hsnOptions,
        confirmed
          ? hsnOptions
              .map((option) => option.id)
              .filter((id) => confirmed.includes(id))
          : hsnOptions.map((option) => option.id),
        true,
      ),
    );
  }

  return {
    clientId: input.clientId,
    onboardingType: input.onboardingType,
    sectionStatus: input.sectionStatus,
    fields,
    selectedProfile: input.selectedProfile,
  };
}

export function normalizeMerchantDetailsSelections(
  selections: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(selections)) {
    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => String(item));
    }
  }

  return normalized;
}

export function isSectionSubmitted(status: string): boolean {
  return (
    status === OnboardingSectionStatus.VERIFICATION_PENDING ||
    status === OnboardingSectionStatus.VERIFIED
  );
}
