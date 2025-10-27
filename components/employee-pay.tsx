"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type CalcResult = {
  grossPay: number;
  cpp: number;
  net: number;
};

export default function PayrollCalculatorPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<string>("");

  const [result, setResult] = useState<CalcResult | null>(null);

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Payroll Calculator
          </CardTitle>
          <p className="text-sm text-gray-500">
            Enter employee info and pay for this pay period. We’ll calculate CPP
            (Canada Pension Plan). EI and tax (FT) are planned but not active yet.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Form goes here…</p>
        </CardContent>
      </Card>
    </div>
  );
}
