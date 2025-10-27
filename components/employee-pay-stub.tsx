"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Paystub = {
  id: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  payDate: string;     // YYYY-MM-DD
  gross: number;
  deductions: number;
  net: number;
};

type DirectDeposit = {
  accountHolder: string;
  bankName: string;
  transitNumber: string;     // 5 digits in CA
  institutionNumber: string; // 3 digits in CA
  accountNumber: string;     // varies
};

const STUBS_KEY = "maplehr_paystubs_v1";
const DIRECT_KEY = "maplehr_direct_deposit_v1";

const uid = () => crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const cad = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
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
  const demo: Paystub[] = [
    { id: uid(), periodStart: "2025-08-16", periodEnd: "2025-08-31", payDate: "2025-09-05", gross: 3200, deductions: 640, net: 2560 },
    { id: uid(), periodStart: "2025-08-01", periodEnd: "2025-08-15", payDate: "2025-08-20", gross: 3200, deductions: 620, net: 2580 },
    { id: uid(), periodStart: "2025-07-16", periodEnd: "2025-07-31", payDate: "2025-08-05", gross: 3200, deductions: 630, net: 2570 },
    { id: uid(), periodStart: "2025-07-01", periodEnd: "2025-07-15", payDate: "2025-07-20", gross: 3200, deductions: 615, net: 2585 },
  ];
  saveStubs(demo);
}

function loadDirect(): DirectDeposit | null {
  try {
    const raw = localStorage.getItem(DIRECT_KEY);
    return raw ? (JSON.parse(raw) as DirectDeposit) : null;
  } catch {
    return null;
  }
}
function saveDirect(data: DirectDeposit) {
  localStorage.setItem(DIRECT_KEY, JSON.stringify(data));
}

export default function EmployeePayStub() {
  const [stubs, setStubs] = React.useState<Paystub[]>([]);
  const [form, setForm] = React.useState<DirectDeposit>({
    accountHolder: "",
    bankName: "",
    transitNumber: "",
    institutionNumber: "",
    accountNumber: "",
  });
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    const s = loadStubs();
    if (!s.length) seedStubs();
    setStubs(loadStubs());

    const d = loadDirect();
    if (d) setForm(d);
  }, []);

  const onChange = (key: keyof DirectDeposit) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const save = () => {
    // Basic trim-only “validation” to keep it simple
    const next: DirectDeposit = {
      accountHolder: form.accountHolder.trim(),
      bankName: form.bankName.trim(),
      transitNumber: form.transitNumber.trim(),
      institutionNumber: form.institutionNumber.trim(),
      accountNumber: form.accountNumber.trim(),
    };
    saveDirect(next);
    setNotice("Direct deposit info saved (local only).");
    setTimeout(() => setNotice(null), 2500);
  };

  const resetDemo = () => {
    seedStubs();
    setStubs(loadStubs());
    setNotice("Demo paycheques reset.");
    setTimeout(() => setNotice(null), 2000);
  };

  // Sort newest first by pay date
  const rows = React.useMemo(
    () => stubs.slice().sort((a, b) => +new Date(b.payDate) - +new Date(a.payDate)),
    [stubs]
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left: Pay history */}
      <Card className="md:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Paycheque History</CardTitle>
          <Button variant="outline" size="sm" onClick={resetDemo}>Reset demo data</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>{fmtDate(p.payDate)}</TableCell>
                  <TableCell>{fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}</TableCell>
                  <TableCell>{cad(p.gross)}</TableCell>
                  <TableCell>{cad(p.deductions)}</TableCell>
                  <TableCell className="font-medium">{cad(p.net)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No paycheques found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right: Direct deposit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Direct Deposit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notice && (
            <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">{notice}</div>
          )}

          <div className="grid gap-2">
            <label className="text-sm">Account holder</label>
            <Input value={form.accountHolder} onChange={onChange("accountHolder")} placeholder="Full name on account" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Bank name</label>
            <Input value={form.bankName} onChange={onChange("bankName")} placeholder="e.g., RBC, TD, Scotiabank" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Transit number (5 digits)</label>
            <Input value={form.transitNumber} onChange={onChange("transitNumber")} placeholder="12345" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Institution number (3 digits)</label>
            <Input value={form.institutionNumber} onChange={onChange("institutionNumber")} placeholder="003" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Account number</label>
            <Input value={form.accountNumber} onChange={onChange("accountNumber")} placeholder="xxxxxxxxx" />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setForm(loadDirect() ?? {
              accountHolder: "", bankName: "", transitNumber: "", institutionNumber: "", accountNumber: ""
            })}>
              Revert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
