"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { calcPayroll } from "@/lib/payrollCalc";
import { supabase } from "@/lib/supabaseClient";

type CalcResult = {
  grossPay: number;
  cpp: number;
  ei: number;
  federalTax: number;
  net: number;
};

function Field(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  const { label, ...inputProps } = props;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Input {...inputProps} />
    </div>
  );
}

function Row({
  label,
  children,
  bold,
}: {
  label: string;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={bold ? "font-semibold text-gray-900" : ""}>
        {children ?? "—"}
      </span>
    </div>
  );
}

export default function PayrollCalculatorPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<string>("");

  // pay frequency selector (default biweekly = 26)
  const [periodsPerYear, setPeriodsPerYear] = useState<number>(26);

  // YTD placeholders (you can replace these with values pulled from Supabase per employee)
  const [cppYTD] = useState<number>(0);
  const [eiYTD] = useState<number>(0);

  const [result, setResult] = useState<CalcResult | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function sanitizePositiveFloat(v: string) {
    const num = parseFloat(v);
    if (Number.isNaN(num) || num < 0) return 0;
    return num;
  }

  function handleCalculate() {
    const h = sanitizePositiveFloat(hoursWorked);
    const r = sanitizePositiveFloat(hourlyRate);

    const payroll = calcPayroll({
      hoursWorked: h,
      hourlyRate: r,
      periodsPerYear,
      cppDeductedYTD: cppYTD,
      eiDeductedYTD: eiYTD,
    });

    setResult(payroll);
    setSavedNotice(null);
  }

  async function handleSave() {
    if (!result) return;

    setSaving(true);
    setSavedNotice(null);

    try {
      const hoursNum = parseFloat(hoursWorked) || 0;
      const rateNum = parseFloat(hourlyRate) || 0;

      // Ensure your Supabase table has these columns:
      // employee_id (text), employee_name (text),
      // hours_worked (numeric), hourly_rate (numeric),
      // periods_per_year (int),
      // gross_pay (numeric), cpp (numeric), ei (numeric),
      // federal_tax (numeric), net_pay (numeric),
      // created_at (timestamptz)
      const { error } = await supabase.from("payroll_records").insert([
        {
          employee_id: employeeId || null,
          employee_name: employeeName || null,

          hours_worked: hoursNum,
          hourly_rate: rateNum,
          periods_per_year: periodsPerYear,

          gross_pay: result.grossPay,
          cpp: result.cpp,
          ei: result.ei,
          federal_tax: result.federalTax,
          net_pay: result.net,

          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      setSavedNotice("Saved to payroll.");
    } catch (e: any) {
      setSavedNotice(`Failed to save: ${e?.message || "unknown error"}`);
    } finally {
        setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Payroll Calculator
          </CardTitle>
          <p className="text-sm text-gray-500">
            Enter employee info and pay for this period. We'll estimate CPP, EI,
            and federal tax using CRA-style per-period rules and show take-home.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Employee info */}
          <section className="grid md:grid-cols-2 gap-4">
            <Field
              label="Employee Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Jane Doe"
            />

            <Field
              label="Employee ID / Number"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="E-1024"
            />
          </section>

          <Separator />

          {/* Pay input */}
          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Hours Worked (this period)"
              type="number"
              min="0"
              step="0.01"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="80"
            />

            <Field
              label="Hourly Rate ($/hr)"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="20.00"
            />

            {/* Pay frequency select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Pay Frequency
              </label>
              <select
                className="border rounded px-2 py-2 text-sm w-full"
                value={periodsPerYear}
                onChange={(e) => setPeriodsPerYear(Number(e.target.value))}
              >
                <option value={52}>Weekly (52)</option>
                <option value={26}>Biweekly (26)</option>
                <option value={24}>Semi-monthly (24)</option>
                <option value={12}>Monthly (12)</option>
              </select>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              type="button"
              onClick={handleCalculate}
              disabled={!hoursWorked || !hourlyRate}
            >
              Calculate
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={!result || saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save to Payroll"}
            </Button>

            {savedNotice && (
              <span className="text-sm text-gray-500">{savedNotice}</span>
            )}
          </div>

          <Separator />

          <section className="grid md:grid-cols-2 gap-6">
            {/* Results card */}
            <Card className="border border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium text-gray-800">
                  Calculated Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <Row label="Gross Pay">{money(result?.grossPay)}</Row>

                <Row label="CPP Deduction">{money(result?.cpp)}</Row>
                <Row label="EI Deduction">{money(result?.ei)}</Row>
                <Row label="Federal Tax Deduction">
                  {money(result?.federalTax)}
                </Row>

                <Separator className="my-2" />

                <Row label="Net Pay (Take Home)" bold>
                  {money(result?.net)}
                </Row>
              </CardContent>
            </Card>

            {/* Summary card */}
            <Card className="border border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium text-gray-800">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <Row label="Employee">{employeeName || "—"}</Row>
                <Row label="Employee ID">{employeeId || "—"}</Row>
                <Row label="Hours">{hoursWorked || "—"}</Row>
                <Row label="Rate ($/hr)">{hourlyRate || "—"}</Row>
                <Row label="Pay Frequency">
                  {freqLabel(periodsPerYear)}
                </Row>
              </CardContent>
            </Card>
          </section>
        </CardContent>
      </Card>
    </div>
  );

  function money(n: number | undefined) {
    if (n === undefined || Number.isNaN(n)) return "—";
    return `$${n.toFixed(2)}`;
  }

  function freqLabel(p: number) {
    switch (p) {
      case 52:
        return "Weekly (52)";
      case 26:
        return "Biweekly (26)";
      case 24:
        return "Semi-monthly (24)";
      case 12:
        return "Monthly (12)";
      default:
        return `${p} / year`;
    }
  }
}
