export type MerchantProfileDirector = {
  din: string;
  pan: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  dateOfAppointment: string;
  disqualified: boolean;
};

export type MerchantProfile = {
  business: {
    legalName: string;
    tradeName: string;
    constitution: string;
    companyType: string;
    companyCategory: string;
    companySubcategory: string;
    classOfCompany: string;
    companyOrigin: string;
    companyStatus: string;
    accountType: string;
    previousCompanyName: string;
  };
  registration: {
    gstin: string;
    cin: string;
    registrationNumber: string;
    gstRegistrationType: string;
    gstRegistrationDate: string;
    gstCancellationDate: string;
    dateOfIncorporation: string;
    rocCode: string;
    rocName: string;
    registrarName: string;
    rdName: string;
    rdRegion: string;
  };
  compliance: {
    gstStatus: string;
    aadhaarVerified: string;
    aadhaarVerificationDate: string;
    ekycFlag: string;
    eInvoiceApplicable: string;
    eInvoiceStatus: string;
    listed: string;
    directorDisqualificationPresent: boolean;
    inc22aFlag: string;
  };
  financial: {
    authorisedCapital: string;
    paidUpCapital: string;
    subscribedCapital: string;
    shareCapitalFlag: string;
    aggregateTurnover: string;
    aggregateTurnoverFY: string;
    percentTaxInCash: string;
    percentTaxInCashFY: string;
    compositionRate: string;
    balanceSheetDate: string;
    lastAGMDate: string;
  };
  contact: {
    email: string;
  };
  businessActivity: {
    natureOfBusiness: string[];
    hsnServices: Array<{ hsnCode: string; hsnDescription: string }>;
  };
  addresses: {
    gstPrincipalAddress: {
      fullAddress: string;
      dealsIn: string;
    };
    gstAdditionalAddresses: unknown[];
    companyAddresses: unknown[];
  };
  directors: MerchantProfileDirector[];
  authorizedSignatories: MerchantProfileDirector[];
  gstFiling: {
    currentYear: unknown[];
    previousYear: unknown[];
    filingFrequency: unknown[];
    filingFrequencyLastYear: unknown[];
  };
  gstLiability: {
    currentFinancialYear: string;
    previousFinancialYear: string;
    previousTotalPercentage: string;
    previousDetails: unknown[];
    currentDetails: unknown[];
  };
  jurisdiction: {
    gstStateJurisdiction: string;
    gstCentralJurisdiction: string;
  };
  verification: {
    gstVerified: boolean;
    cinVerified: boolean;
    companyVerified: boolean;
  };
};

export function asString(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildFullName(
  first: string,
  middle: string,
  last: string,
): string {
  return [first, middle, last].filter((part) => part.trim()).join(' ');
}

/** GSTIN positions 3-12 are PAN. */
export function extractPanFromGstin(gstin: string): string {
  const normalized = gstin.trim().toUpperCase();
  if (normalized.length < 12) {
    return '';
  }
  return normalized.slice(2, 12);
}

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(
      /\b(private|pvt|ltd|limited|llp|opc|company|corp|corporation)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Progressive search terms for CIN-by-name vendor API. */
export function buildCompanyNameSearchTerms(legalName: string): string[] {
  const trimmed = legalName.trim();
  if (!trimmed) {
    return [];
  }

  const withoutSuffix = trimmed
    .replace(
      /\b(private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|llp|opc)\b/gi,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

  const normalized = normalizeCompanyName(trimmed);
  const terms = [trimmed, withoutSuffix, normalized].filter(Boolean);

  const words = normalized.split(' ').filter((w) => w.length > 2);
  if (words.length >= 2) {
    terms.push(words.slice(0, 2).join(' '));
  }
  if (words.length >= 1) {
    terms.push(words[0]);
  }

  return [...new Set(terms.map((t) => t.trim()).filter(Boolean))];
}

function getCinFromRow(row: Record<string, unknown>): string {
  return asString(row.cin_number || row.cin || row.company_id);
}

export function mapDirectorsFromCompany(
  directorData: unknown,
): MerchantProfileDirector[] {
  if (!Array.isArray(directorData)) {
    return [];
  }

  const mapped = directorData.map((raw) => {
    const item = asRecord(raw);
    const firstName = asString(item.first_name);
    const middleName = asString(item.middle_name);
    const lastName = asString(item.last_name);
    const disqualifiedRaw = asString(item.director_disqualified).toUpperCase();

    return {
      din: asString(item.din),
      pan: asString(item.pan),
      firstName,
      middleName,
      lastName,
      fullName: buildFullName(firstName, middleName, lastName),
      dateOfAppointment: asString(item.date_of_appointment),
      disqualified: disqualifiedRaw === 'Y' || disqualifiedRaw === 'TRUE',
    };
  });

  // Vendor sometimes duplicates the same director rows.
  const seen = new Set<string>();
  return mapped.filter((director) => {
    const key = `${director.din}|${director.dateOfAppointment}|${director.fullName}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectRowsByKeys(
  keys: string[],
  ...sources: Array<Record<string, unknown>>
): unknown[] {
  const rows: unknown[] = [];
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value) && value.length) {
        rows.push(...value);
      }
    }
  }
  return rows;
}

/** Unwrap vendor company payload whether nested under data or flat. */
export function unwrapCompanyPayload(
  companyResponse: Record<string, unknown> | null,
): {
  company: Record<string, unknown>;
  directors: MerchantProfileDirector[];
  authorizedSignatories: MerchantProfileDirector[];
  rawData: Record<string, unknown>;
} {
  if (!companyResponse) {
    return {
      company: {},
      directors: [],
      authorizedSignatories: [],
      rawData: {},
    };
  }

  const data = asRecord(companyResponse.data);
  const hasCompanyShape = (obj: Record<string, unknown>) =>
    Boolean(
      obj.company_data ||
        obj.director_data ||
        obj.signatory_director ||
        obj.cin,
    );

  // Prefer `data` wrapper from vendor; also accept already-unwrapped payload.
  const root = hasCompanyShape(data)
    ? data
    : hasCompanyShape(companyResponse)
      ? companyResponse
      : Object.keys(data).length
        ? data
        : companyResponse;

  const company = asRecord(
    root.company_data && typeof root.company_data === 'object'
      ? root.company_data
      : root.cin
        ? root
        : {},
  );

  const sources = [root, data, companyResponse, asRecord(companyResponse.data)];
  const directorSource = collectRowsByKeys(
    ['director_data', 'directors', 'Director_data'],
    ...sources,
  );
  const signatorySource = collectRowsByKeys(
    ['signatory_director', 'authorized_signatories', 'signatories'],
    ...sources,
  );

  return {
    company,
    directors: mapDirectorsFromCompany(directorSource),
    authorizedSignatories: mapDirectorsFromCompany(signatorySource),
    rawData: root,
  };
}

export function buildMerchantProfile(params: {
  gstResponse: Record<string, unknown> | null;
  cinLookupResponse: Record<string, unknown> | null;
  companyResponse: Record<string, unknown> | null;
  selectedCin: string;
  selectedCinRow: Record<string, unknown> | null;
}): MerchantProfile {
  const gstData = asRecord(params.gstResponse?.data);
  const basic = asRecord(gstData.basicDetails);
  const hsnDetails = asRecord(gstData.hsnDetails);
  const branchDetails = asRecord(gstData.branchDetails);
  const permanentAdd = asRecord(branchDetails.permanentAdd);
  const filingDetails = asRecord(gstData.filingDetails);
  const currentYear = asRecord(filingDetails.currentYear);
  const previousYear = asRecord(filingDetails.previousYear);
  const liability = asRecord(gstData.liabilityPaidDetails);

  const { company, directors, authorizedSignatories } = unwrapCompanyPayload(
    params.companyResponse,
  );
  const cinRow = params.selectedCinRow ?? {};

  const services = asArray(hsnDetails.services).map((item) => {
    const service = asRecord(item);
    return {
      hsnCode: asString(service.hsnCode),
      hsnDescription: asString(service.hsnDescription),
    };
  });

  const directorDisqualificationPresent = [
    ...directors,
    ...authorizedSignatories,
  ].some((d) => d.disqualified);
  const selectedCin =
    params.selectedCin || asString(company.cin) || getCinFromRow(cinRow);

  const gstVerified =
    String(params.gstResponse?.status ?? '').toUpperCase() === 'SUCCESS';
  const companyStatus = String(
    params.companyResponse?.status ?? '',
  ).toUpperCase();
  const companyVerified =
    companyStatus === 'SUCCESS' || Boolean(asString(company.cin));
  const cinVerified = Boolean(selectedCin);

  return {
    business: {
      legalName: asString(basic.Legal_Name) || asString(company.company),
      tradeName: asString(basic.tradeNam),
      constitution: asString(basic.constitution),
      companyType:
        asString(company.company_type) ||
        asString(cinRow.company_type) ||
        asString(basic.constitution),
      companyCategory: asString(company.company_category),
      companySubcategory: asString(company.company_subcategory),
      classOfCompany: asString(company.class_of_company),
      companyOrigin:
        asString(company.company_origin) || asString(cinRow.company_origin),
      companyStatus:
        asString(company.llp_status) ||
        asString(cinRow.company_status) ||
        asString(basic.registrationStatus),
      accountType: asString(cinRow.account_type),
      previousCompanyName: asString(cinRow.previous_company_name),
    },
    registration: {
      gstin: asString(basic.gstin),
      cin: selectedCin,
      registrationNumber:
        asString(company.registration_number) ||
        asString(cinRow.registration_number),
      gstRegistrationType: asString(basic.registrationType),
      gstRegistrationDate: asString(basic.registrationDate),
      gstCancellationDate: asString(basic.cancelationDate),
      dateOfIncorporation:
        asString(company.date_of_incorporation) ||
        asString(cinRow.date_of_incorporation),
      rocCode: asString(cinRow.roc_code) || asString(company.roc_name),
      rocName: asString(company.roc_name) || asString(cinRow.roc_code),
      registrarName: asString(cinRow.registrar_name),
      rdName: asString(company.rd_name),
      rdRegion: asString(company.rd_region),
    },
    compliance: {
      gstStatus: asString(basic.registrationStatus),
      aadhaarVerified: asString(basic.aadharVerified),
      aadhaarVerificationDate: asString(basic.aadharVerDate),
      ekycFlag: asString(basic.Ekyc_Flag),
      eInvoiceApplicable: asString(basic.mandatedeInvoice),
      eInvoiceStatus: asString(basic.einvoiceStatus),
      listed: asString(company.whether_listed_or_not),
      directorDisqualificationPresent,
      inc22aFlag: asString(company.inc22aflag),
    },
    financial: {
      authorisedCapital: asString(company.authorised_capital),
      paidUpCapital: asString(company.paid_up_capital),
      subscribedCapital: asString(company.subscribed_capital),
      shareCapitalFlag: asString(company.share_capital_flag),
      aggregateTurnover: asString(basic.aggreTurnOver),
      aggregateTurnoverFY: asString(basic.aggreTurnOverFY),
      percentTaxInCash: asString(basic.percentTaxInCash),
      percentTaxInCashFY: asString(basic.percentTaxInCashFY),
      compositionRate: asString(basic.compositionRate),
      balanceSheetDate: asString(company.balance_sheet_date),
      lastAGMDate: asString(company.date_of_last_agm),
    },
    contact: {
      email: asString(company.email_address),
    },
    businessActivity: {
      natureOfBusiness: asArray(basic.businessNature).map((item) =>
        asString(item),
      ),
      hsnServices: services,
    },
    addresses: {
      gstPrincipalAddress: {
        fullAddress: asString(permanentAdd.address),
        dealsIn: asString(permanentAdd.dealsIn),
      },
      gstAdditionalAddresses: asArray(branchDetails.additionalAdd),
      companyAddresses: asArray(company.company_address),
    },
    directors,
    authorizedSignatories,
    gstFiling: {
      currentYear: asArray(currentYear.filingStatus),
      previousYear: asArray(previousYear.filingStatus),
      filingFrequency: asArray(gstData.filingFrequency),
      filingFrequencyLastYear: asArray(gstData.filingFrequencyLastYear),
    },
    gstLiability: {
      currentFinancialYear: asString(liability.currFinYear),
      previousFinancialYear: asString(liability.PrevFinYear),
      previousTotalPercentage: asString(liability.prevTotal_pct),
      previousDetails: asArray(liability.prevDetails),
      currentDetails: asArray(liability.currDetails),
    },
    jurisdiction: {
      gstStateJurisdiction: asString(basic.jurisdiction),
      gstCentralJurisdiction: asString(basic.ctj),
    },
    verification: {
      gstVerified,
      cinVerified,
      companyVerified,
    },
  };
}

export function selectCinMatch(
  legalName: string,
  cinLookupResponse: Record<string, unknown> | null,
): { cin: string; row: Record<string, unknown> | null } {
  const data = cinLookupResponse?.data;
  if (!Array.isArray(data) || data.length === 0) {
    return { cin: '', row: null };
  }

  const rows = data.map((item) => asRecord(item));
  const normalizedLegal = normalizeCompanyName(legalName);

  const exact = rows.find(
    (row) =>
      asString(row.company_name).trim().toLowerCase() ===
      legalName.trim().toLowerCase(),
  );
  if (exact) {
    return { cin: getCinFromRow(exact), row: exact };
  }

  const normalizedExact = rows.find(
    (row) => normalizeCompanyName(asString(row.company_name)) === normalizedLegal,
  );
  if (normalizedExact) {
    return { cin: getCinFromRow(normalizedExact), row: normalizedExact };
  }

  const partial = rows.find((row) => {
    const candidate = normalizeCompanyName(asString(row.company_name));
    return (
      candidate.includes(normalizedLegal) ||
      normalizedLegal.includes(candidate) ||
      normalizedLegal
        .split(' ')
        .filter((w) => w.length > 3)
        .every((w) => candidate.includes(w))
    );
  });
  if (partial) {
    return { cin: getCinFromRow(partial), row: partial };
  }

  const active = rows.find(
    (row) => asString(row.company_status).trim().toLowerCase() === 'active',
  );
  if (active) {
    return { cin: getCinFromRow(active), row: active };
  }

  return { cin: getCinFromRow(rows[0]), row: rows[0] };
}

export function listCinCandidates(
  cinLookupResponse: Record<string, unknown> | null,
): Array<Record<string, unknown>> {
  const data = cinLookupResponse?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => asRecord(item)).filter((row) => getCinFromRow(row));
}

export function getCinNumber(row: Record<string, unknown>): string {
  return getCinFromRow(row);
}
