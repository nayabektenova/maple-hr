// components/submit-claim.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Category = "Travel" | "Meals" | "Lodging" | "Office Supplies" | "Training" | "Other";
type Claim = {
  id: string;
  submittedAt: string; // ISO
  date: string;        // YYYY-MM-DD
  category: Category;
  amount: number;
  description?: string;
  status: "pending";
};

const KEY = "maplehr_expense_claims_v1";
const uid = () => crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const cad = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
const fmt = (d: string) => {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleString();
};

function loadClaims(): Claim[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Claim[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveClaims(rows: Claim[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export default function SubmitClaim() {
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState<Category | "">("");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setClaims(loadClaims());
  }, []);

  const rows = React.useMemo(
    () => claims.slice().sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)),
    [claims]
  );

  function clearForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("");
    setAmount("");
    setDescription("");
    setError(null);
  }

  function submit() {
    setError(null);
    const amt = Number(amount);
    if (!date) return setError("Please select a date.");
    if (!category) return setError("Please choose a category.");
    if (!amount || Number.isNaN(amt) || amt <= 0) return setError("Enter a valid amount greater than 0.");

    const next: Claim = {
      id: uid(),
      submittedAt: new Date().toISOString(),
      date,
      category: category as Category,
      amount: Math.round(amt * 100) / 100,
      description: description.trim() || undefined,
      status: "pending",
    };

    setClaims((prev) => {
      const arr = [next, ...prev];
      saveClaims(arr);
      return arr;
    });

    clearForm();
    setNotice("Expense claim submitted (local only).");
    setTimeout(() => setNotice(null), 2500);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit Expense Claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notice && <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">{notice}</div>}
          {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-900">{error}</div>}

          <div className="grid gap-2">
            <label className="text-sm">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Category</label>
            {/* No empty-value item; pass undefined to show placeholder when empty */}
            <Select value={(category as string) || undefined} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Meals">Meals</SelectItem>
                <SelectItem value="Lodging">Lodging</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Amount (CAD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Description (optional)</label>
            <Textarea
              rows={3}
              placeholder="Brief details of the expense"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={submit}>Submit</Button>
            <Button variant="outline" onClick={clearForm}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: Submitted claims */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submitted Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-600">{fmt(c.submittedAt)}</TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell className="font-medium">{cad(c.amount)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No claims submitted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
