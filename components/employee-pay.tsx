"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
  // we'll add <Input> import + actual input later
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        {...inputProps}
      />
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
