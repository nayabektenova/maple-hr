// lib/payrollCalc.ts
export type PayrollInputs = {
  hoursWorked: number;
  hourlyRate: number;
};

export type PayrollOutputs = {
  grossPay: number;
  cpp: number;
  ei: number;
  federalTax: number;
  net: number;
};

export function calcPayroll({ hoursWorked, hourlyRate }: PayrollInputs): PayrollOutputs {
  const grossPay = hoursWorked * hourlyRate;

  // CPP (placeholder): 5.95% of gross
  const cppRate = 0.0595;
  const cpp = grossPay * cppRate;

  // EI: 1.64% of gross
  const eiRate = 0.0164;
  const ei = grossPay * eiRate;

  // Federal Tax (this is the custom logic which was discussed in group )
  let federalTax = 0;
  const exemptionThreshold = 605;
  const federalTaxRate = 0.145; // 14.5%

  if (grossPay > exemptionThreshold) {
    const exemptionAmount = grossPay - exemptionThreshold;
    federalTax = exemptionAmount * federalTaxRate;
  } else {
    federalTax = 0;
  }

  // Net pay after all deductions
  const net = grossPay - (cpp + ei + federalTax);

  return {
    grossPay: round2(grossPay),
    cpp: round2(cpp),
    ei: round2(ei),
    federalTax: round2(federalTax),
    net: round2(net),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
