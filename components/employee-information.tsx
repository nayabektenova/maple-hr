"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2 } from "lucide-react";

interface EmployeeInformationProps {
  employeeId: string;
}

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  personal_email: string | null;
  phone_number: string | null;
  passport_number: string | null;
  date_of_birth: string | null;  // ISO date string (YYYY-MM-DD)
  place_of_birth: string | null;
  marital_status: string | null;
  emergency_contact: string | null;
  nationality: string | null;
  position: string | null;
  department: string | null;
  manager_name: string | null;
  joining_date: string | null;   // ISO
  current_contract: string | null;
  work_email: string | null;
  work_phone: string | null;
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const MARITAL_OPTIONS = ["Single", "Married", "Partnered", "Divorced", "Widowed"];
const CONTRACT_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const COUNTRY_OPTIONS = ["Canada", "United States", "United Kingdom", "Australia", "India", "Philippines", "Nigeria", "Pakistan", "China", "Brazil", "Germany", "France"];

export function EmployeeInformation({ employeeId }: EmployeeInformationProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [form, setForm] = useState<EmployeeRow | null>(null);

  const fmtDate = (iso?: string | null) =>
    iso ? (iso.length >= 10 ? iso.slice(0, 10) : iso) : "";

  useEffect(() => {
    let cancelled = false;

    async function fetchOne() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error: err } = await supabase
        .from("employees")
        .select([
          "id",
          "first_name",
          "last_name",
          "gender",
          "personal_email",
          "phone_number",
          "passport_number",
          "date_of_birth",
          "place_of_birth",
          "marital_status",
          "emergency_contact",
          "nationality",
          "position",
          "department",
          "manager_name",
          "joining_date",
          "current_contract",
          "work_email",
          "work_phone",
        ].join(","))
        .eq("id", employeeId)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else if (!data) {
        setError("Employee not found");
      } else if (typeof data === "object" && data !== null && "id" in data) {
        setEmployee(data as EmployeeRow);
        setForm(data as EmployeeRow);
      }
      setLoading(false);
    }

    if (employeeId) fetchOne();
    return () => { cancelled = true; };
  }, [employeeId]);

  const fullName = useMemo(() => {
    if (!employee) return "";
    const a = employee.first_name?.trim() ?? "";
    const b = employee.last_name?.trim() ?? "";
    return [a, b].filter(Boolean).join(" ");
  }, [employee]);

  const startEdit = () => {
    if (!employee) return;
    setForm(employee);       // reset form from latest data
    setEditing(true);
    setSuccess(null);
    setError(null);
  };

  const cancelEdit = () => {
    setForm(employee);       // revert any changes
    setEditing(false);
    setSuccess(null);
    setError(null);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    // never send id in update payload
    const { id, ...payload } = form;

    // normalize dates to YYYY-MM-DD
    (payload as any).date_of_birth = fmtDate(form.date_of_birth);
    (payload as any).joining_date = fmtDate(form.joining_date);

    const { error: upErr } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", form.id);

    setSaving(false);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    setEmployee(form);   // optimistic: reflect saved values
    setEditing(false);
    setSuccess("Saved!");
  };

  const onChange = <K extends keyof EmployeeRow>(key: K, value: EmployeeRow[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-72 rounded bg-gray-100 animate-pulse" />
            <div className="h-72 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-72 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-red-600">{error}</p></CardContent>
      </Card>
    );
  }

  if (!employee || !form) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{fullName || "Employee"}</h2>
          <p className="text-sm text-gray-500">ID: {employee.id}</p>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button variant="default" size="sm" onClick={startEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Link href="/employees">
                <Button variant="secondary" size="sm">Back to list</Button>
              </Link>
            </>
          ) : (
            <>
              <Button size="sm" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" size="sm" disabled={saving} onClick={cancelEdit}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
              
            </CardHeader>

            <CardContent className="space-y-6">
              <Grid2>
                <TextField label="First Name" value={form.first_name} readOnly={!editing}
                           onChange={(v) => onChange("first_name", v)} />
                <TextField label="Last Name" value={form.last_name} readOnly={!editing}
                           onChange={(v) => onChange("last_name", v)} />
              </Grid2>

              <Grid2>
                <SelectField label="Gender" value={form.gender ?? ""} readOnly={!editing}
                             options={GENDER_OPTIONS}
                             onChange={(v) => onChange("gender", v)} />
                <DateField label="Date of Birth" value={fmtDate(form.date_of_birth)} readOnly={!editing}
                           onChange={(v) => onChange("date_of_birth", v)} />
              </Grid2>

              <Grid2>
                <TextField label="Place of Birth" value={form.place_of_birth} readOnly={!editing}
                           onChange={(v) => onChange("place_of_birth", v)} />
                <TextField label="Passport Number" value={form.passport_number} readOnly={!editing}
                           onChange={(v) => onChange("passport_number", v)} />
              </Grid2>

              <Grid2>
                <TextField label="Personal Email" value={form.personal_email} readOnly={!editing}
                           onChange={(v) => onChange("personal_email", v)} />
                <TextField label="Phone Number" value={form.phone_number} readOnly={!editing}
                           onChange={(v) => onChange("phone_number", v)} />
              </Grid2>

              <Grid2>
                <SelectField label="Marital Status" value={form.marital_status ?? ""} readOnly={!editing}
                             options={MARITAL_OPTIONS}
                             onChange={(v) => onChange("marital_status", v)} />
                <TextField label="Emergency Contact" value={form.emergency_contact} readOnly={!editing}
                           onChange={(v) => onChange("emergency_contact", v)} />
              </Grid2>

              <Grid2>
                <SelectField label="Nationality" value={form.nationality ?? ""} readOnly={!editing}
                             options={COUNTRY_OPTIONS}
                             onChange={(v) => onChange("nationality", v)} />
              </Grid2>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Grid2>
                <TextField label="Position" value={form.position} readOnly={!editing}
                           onChange={(v) => onChange("position", v)} />
                <TextField label="Department" value={form.department} readOnly={!editing}
                           onChange={(v) => onChange("department", v)} />
              </Grid2>

              <Grid2>
                <TextField label="Manager" value={form.manager_name} readOnly={!editing}
                           onChange={(v) => onChange("manager_name", v)} />
                <DateField label="Joining Date" value={fmtDate(form.joining_date)} readOnly={!editing}
                           onChange={(v) => onChange("joining_date", v)} />
              </Grid2>

              <Grid2>
                <SelectField label="Current Contract" value={form.current_contract ?? ""} readOnly={!editing}
                             options={CONTRACT_OPTIONS}
                             onChange={(v) => onChange("current_contract", v)} />
                <TextField label="Work Email" value={form.work_email} readOnly={!editing}
                           onChange={(v) => onChange("work_email", v)} />
              </Grid2>

              <Grid2>
                <TextField label="Work Phone" value={form.work_phone} readOnly={!editing}
                           onChange={(v) => onChange("work_phone", v)} />
              </Grid2>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

function TextField({
  label, value, readOnly, onChange,
}: {
  label: string;
  value?: string | null;
  readOnly?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        value={value ?? ""}
        readOnly={!!readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={readOnly ? "w-full bg-gray-50" : "w-full"}
      />
    </div>
  );
}

function DateField({
  label, value, readOnly, onChange,
}: {
  label: string;
  value?: string | null;
  readOnly?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          type="date"
          value={value ?? ""}
          readOnly={!!readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={readOnly ? "w-full bg-gray-50" : "w-full"}
        />
        {readOnly && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label, value, readOnly, options, onChange,
}: {
  label: string;
  value?: string | null;
  readOnly?: boolean;
  options: string[];
  onChange?: (v: string) => void;
}) {
  const v = value ?? "";
  if (readOnly) {
    return <TextField label={label} value={v} readOnly />;
  }
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={v} onValueChange={(val) => onChange?.(val)}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
