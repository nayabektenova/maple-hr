"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Paystub = {
  id: string;
  employeeName: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  payDate: string; // YYYY-MM-DD
  totalHours: number;
  minPayPerHr: number;
  gross: number;
  cpp: number;
  ei: number;
  ft: number;
  deductions: number; // cpp+ei+ft
  net: number;
};

const STUBS_KEY = "maplehr_paystubs_v1";

const uid = () =>
  crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const cad = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
};

function loadStubs(): Paystub[] {
  try {
    const raw = localStorage.getItem(STUBS_KEY);
    return raw ? (JSON.parse(raw) as Paystub[]) : [];
  } catch {
    return [];
  }
}
function saveStubs(rows: Paystub[]) {
  localStorage.setItem(STUBS_KEY, JSON.stringify(rows));
}
function seedStubs() {
  const make = (
    employeeName: string,
    periodStart: string,
    periodEnd: string,
    payDate: string,
    totalHours: number,
    minPayPerHr: number
  ) => {
    const gross = Math.round(totalHours * minPayPerHr * 100) / 100;
    const { cpp, ei, ft } = calculateDeductions(gross);
    const deductions = Math.round((cpp + ei + ft) * 100) / 100;
    const net = Math.round((gross - deductions) * 100) / 100;
    return {
      id: uid(),
      employeeName,
      periodStart,
      periodEnd,
      payDate,
      totalHours,
      minPayPerHr,
      gross,
      cpp,
      ei,
      ft,
      deductions,
      net,
    } as Paystub;
  };

  const demo: Paystub[] = [
    make("Jane Doe", "2025-08-16", "2025-08-31", "2025-09-05", 80, 40),
    make("John Smith", "2025-08-01", "2025-08-15", "2025-08-20", 80, 40),
    make("Alex Rivera", "2025-07-16", "2025-07-31", "2025-08-05", 80, 40),
    make("Priya K", "2025-07-01", "2025-07-15", "2025-07-20", 80, 40),
  ];
  saveStubs(demo);
}

/* Company formulas */
const CPP_EXEMPTION = 134.62;
const CPP_RATE = 0.0595; // 5.95%
const EI_RATE = 0.0164; // 1.64%
const FT_THRESHOLD = 605; // CAD
const FT_RATE = 0.145; // 14.5%

function calculateDeductions(gross: number) {
  const cppRaw = gross > CPP_EXEMPTION ? (gross - CPP_EXEMPTION) * CPP_RATE : 0;
  const eiRaw = gross * EI_RATE;
  const ftRaw = gross > FT_THRESHOLD ? (gross - FT_THRESHOLD) * FT_RATE : 0;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { cpp: round(cppRaw), ei: round(eiRaw), ft: round(ftRaw) };
}

export default function EmployeePayStub() {
  const [stubs, setStubs] = React.useState<Paystub[]>([]);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [lastCalc, setLastCalc] = React.useState<Paystub | null>(null); // NEW: to show last calculation

  // generate form state
  const [gen, setGen] = React.useState({
    employeeName: "",
    payDate: "",
    periodStart: "",
    periodEnd: "",
    totalHours: "",
    minPayPerHr: "",
  });
  const [genNotice, setGenNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    const s = loadStubs();
    if (!s.length) seedStubs();
    const loaded = loadStubs();
    setStubs(loaded);
    setLastCalc(loaded[0] ?? null); // show most recent one initially
  }, []);

  const resetDemo = () => {
    seedStubs();
    const loaded = loadStubs();
    setStubs(loaded);
    setLastCalc(loaded[0] ?? null); // show newest seeded stub
    setNotice("Demo paycheques reset.");
    setTimeout(() => setNotice(null), 2000);
  };

  const onGenChange =
    (key: keyof typeof gen) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setGen((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const resetGen = () => {
    setGen({
      employeeName: "",
      payDate: "",
      periodStart: "",
      periodEnd: "",
      totalHours: "",
      minPayPerHr: "",
    });
    setGenNotice(null);
  };

  const onGenerate = () => {
    const employeeName = gen.employeeName.trim();
    const payDate = gen.payDate;
    const periodStart = gen.periodStart;
    const periodEnd = gen.periodEnd;
    const totalHours = Number(gen.totalHours);
    const minPayPerHr = Number(gen.minPayPerHr);

    if (
      !employeeName ||
      !payDate ||
      !periodStart ||
      !periodEnd ||
      isNaN(totalHours) ||
      isNaN(minPayPerHr)
    ) {
      setGenNotice("Please fill all fields correctly.");
      setTimeout(() => setGenNotice(null), 2200);
      return;
    }

    // calculate gross and deductions
    const gross = Math.round(totalHours * minPayPerHr * 100) / 100;
    const { cpp, ei, ft } = calculateDeductions(gross);
    const deductions = Math.round((cpp + ei + ft) * 100) / 100;
    const net = Math.round((gross - deductions) * 100) / 100;

    const newStub: Paystub = {
      id: uid(),
      employeeName,
      periodStart,
      periodEnd,
      payDate,
      totalHours,
      minPayPerHr,
      gross,
      cpp,
      ei,
      ft,
      deductions,
      net,
    };

    const next = [...stubs, newStub];
    saveStubs(next);
    setStubs(next);
    setLastCalc(newStub); // ✅ show new calculation immediately
    setGenNotice("Paystub generated and saved.");
    setTimeout(() => setGenNotice(null), 2400);
    resetGen();
  };

  // Sort newest first by pay date
  const rows = React.useMemo(
    () =>
      stubs.slice().sort((a, b) => +new Date(b.payDate) - +new Date(a.payDate)),
    [stubs]
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Generate Paystub */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Generate Paystub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {genNotice && (
            <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
              {genNotice}
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="text-sm">Employee name</label>
              <Input
                value={gen.employeeName}
                onChange={onGenChange("employeeName")}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm">Pay date</label>
              <Input
                type="date"
                value={gen.payDate}
                onChange={onGenChange("payDate")}
              />
            </div>

            <div>
              <label className="text-sm">Period start</label>
              <Input
                type="date"
                value={gen.periodStart}
                onChange={onGenChange("periodStart")}
              />
            </div>

            <div>
              <label className="text-sm">Period end</label>
              <Input
                type="date"
                value={gen.periodEnd}
                onChange={onGenChange("periodEnd")}
              />
            </div>

            <div>
              <label className="text-sm">Total hours</label>
              <Input
                type="number"
                value={gen.totalHours}
                onChange={onGenChange("totalHours")}
                placeholder="e.g. 80"
              />
            </div>

            <div>
              <label className="text-sm">Min pay/hr</label>
              <Input
                type="number"
                value={gen.minPayPerHr}
                onChange={onGenChange("minPayPerHr")}
                placeholder="e.g. 40"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onGenerate}>Generate & Save</Button>
            <Button variant="outline" onClick={resetGen}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Left: Pay history */}
      <Card className="md:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Employee Paystub</CardTitle>
          <Button variant="outline" size="sm" onClick={resetDemo}>
            Reset demo data
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Min Pay/hr</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>{p.employeeName}</TableCell>
                  <TableCell>{fmtDate(p.payDate)}</TableCell>
                  <TableCell>
                    {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                  </TableCell>
                  <TableCell>{p.totalHours}</TableCell>
                  <TableCell>{cad(p.minPayPerHr)}</TableCell>
                  <TableCell>{cad(p.gross)}</TableCell>
                  <TableCell>{cad(p.deductions)}</TableCell>
                  <TableCell className="font-medium">{cad(p.net)}</TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No paycheques found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right column: Show last generated paystub details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!lastCalc && rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No calculations yet.
            </div>
          ) : (
            (() => {
              const last = lastCalc ?? rows[0];
              if (!last)
                return (
                  <div className="text-sm text-muted-foreground">
                    No calculations yet.
                  </div>
                );
              return (
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>{last.employeeName}</strong>
                  </div>
                  <div>Gross pay: {cad(last.gross)}</div>
                  <div>CPP deduction: {cad(last.cpp)}</div>
                  <div>EI deduction: {cad(last.ei)}</div>
                  <div>Federal tax (FT): {cad(last.ft)}</div>
                  <Separator />
                  <div className="font-medium">
                    Net pay: {cad(last.net)}
                  </div>
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
