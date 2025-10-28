// lib/payrollCalc.ts
export type PayrollInputs = {
  hoursWorked: number;
  hourlyRate: number;

  // user-selected pay frequency:
  // 12 = monthly, 24 = semi-monthly, 26 = biweekly, 52 = weekly, etc.
  periodsPerYear: number;

  // (optional) running totals for CPP/EI caps can be added later
  cppDeductedYTD?: number;
  eiDeductedYTD?: number;
};

export type PayrollOutputs = {
  grossPay: number;
  cpp: number;
  ei: number;
  federalTax: number;
  net: number;
};

// 2025 constants (employee side)
const CPP_RATE = 0.0595; // 5.95%
const CPP_BASIC_EXEMPTION_ANNUAL = 3500;
const CPP_MAX_EARNINGS = 68500; // base CPP ceiling for main contribution bucket
const CPP_MAX_CONTRIB = 4034.10; // annual max employee CPP (before CPP2)

const EI_RATE = 0.0166; // 1.66%
const EI_MAX_EARNINGS = 63200; // max insurable earnings
const EI_MAX_CONTRIB = 1048.12; // annual max employee EI

const FED_TAX_RATE = 0.15; // we're approximating first federal bracket
const FED_EXEMPTION_ANNUAL = 15705; // basic personal amount (no fed tax on this chunk)

export function calcPayroll({
  hoursWorked,
  hourlyRate,
  periodsPerYear,
  cppDeductedYTD = 0,
  eiDeductedYTD = 0,
}: PayrollInputs): PayrollOutputs {
  // 1. Gross for this pay period
  const grossPay = hoursWorked * hourlyRate;

  // ===== CPP =====
  // prorate the $3,500 basic exemption and the yearly ceiling to this period
  const cppExemptionPerPeriod = CPP_BASIC_EXEMPTION_ANNUAL / periodsPerYear;
  const cppEarningsCeilingPerPeriod = CPP_MAX_EARNINGS / periodsPerYear;

  // pensionable earnings this period (can't go below 0)
  const cppPensionableRaw = Math.max(0, grossPay - cppExemptionPerPeriod);

  // cap pensionable earnings at the per-period slice of the YMPE ceiling
  const cppPensionableThisPeriod = Math.min(
    cppPensionableRaw,
    Math.max(0, cppEarningsCeilingPerPeriod - cppExemptionPerPeriod)
  );

  // raw CPP for this cheque
  let cppThisPeriod = cppPensionableThisPeriod * CPP_RATE;

  // enforce annual max using YTD (so we don't over-deduct late in the year)
  const cppRemainingAllowed = Math.max(0, CPP_MAX_CONTRIB - cppDeductedYTD);
  cppThisPeriod = Math.min(cppThisPeriod, cppRemainingAllowed);

  // ===== EI =====
  // EI is just % of insurable earnings up to max insurable per period,
  // and then capped by annual remaining room.
  const eiInsurableCeilingPerPeriod = EI_MAX_EARNINGS / periodsPerYear;
  const eiInsurableThisPeriod = Math.min(grossPay, eiInsurableCeilingPerPeriod);

  let eiThisPeriod = eiInsurableThisPeriod * EI_RATE;

  const eiRemainingAllowed = Math.max(0, EI_MAX_CONTRIB - eiDeductedYTD);
  eiThisPeriod = Math.min(eiThisPeriod, eiRemainingAllowed);

  // ===== Federal Tax (approximation) =====
  // We simulate: first slice of income is tax-free (Basic Personal Amount),
  // applied proportionally each period, and then tax 15% on the rest.
  const exemptPerPeriod = FED_EXEMPTION_ANNUAL / periodsPerYear;
  const taxableThisPeriod = Math.max(0, grossPay - exemptPerPeriod);
  const federalTaxThisPeriod = taxableThisPeriod * FED_TAX_RATE;

  // ===== Net =====
  const net = grossPay - (cppThisPeriod + eiThisPeriod + federalTaxThisPeriod);

  return {
    grossPay: round2(grossPay),
    cpp: round2(cppThisPeriod),
    ei: round2(eiThisPeriod),
    federalTax: round2(federalTaxThisPeriod),
    net: round2(net),
  };
}

// helper
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
