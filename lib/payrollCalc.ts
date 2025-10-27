export type PayrollInputs = {
  hoursWorked: number;
  hourlyRate: number;
};

export type PayrollOutputs = {
  grossPay: number;
  cpp: number;
  // ei?: number; // future
  // ft?: number; // future (tax)
  net: number;
};

export function calcPayroll({ hoursWorked, hourlyRate }: PayrollInputs): PayrollOutputs {
  const grossPay = hoursWorked * hourlyRate;

  // CPP placeholder ~5.95%, real CPP will consider yearly max + basic exemption
  const cppRate = 0.0595;
  const cpp = grossPay * cppRate;

  // const ei = ...
  // const ft = ...

  const net = grossPay - cpp;

  return {
    grossPay: round2(grossPay),
    cpp: round2(cpp),
    net: round2(net),
  };
}

// local util
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
