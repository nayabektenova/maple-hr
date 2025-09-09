// app/admin/viewemployee/page.tsx
"use client";

import React, { useMemo, useState } from "react";

// ---- Types ----
type Employee = {
  firstName: string;
  lastName: string;
  employeeId: string;
  gender: string;
  personalEmail: string;
  phoneNumber: string;
  passportNumber: string;
  dateOfBirth: string;     // YYYY-MM-DD
  placeOfBirth: string;
  materialStatus: string;  // (kept as provided)
  emergencyContact: string;
  nationality: string;
  position: string;
  department: string;
  manager: string;
  joiningDate: string;     // YYYY-MM-DD
  currentContract: string;
  workEmail: string;
  workPhone: string;
};

// ---- Sample Data ----
const EMPLOYEES: Employee[] = [
  {
    firstName: "Harry",
    lastName: "Styles",
    employeeId: "12345678",
    gender: "Male",
    personalEmail: "email@personal.com",
    phoneNumber: "+1 234 56789",
    passportNumber: "12345678",
    dateOfBirth: "1994-02-01",
    placeOfBirth: "UK",
    materialStatus: "Single",
    emergencyContact: "+1 234 56789",
    nationality: "UK",
    position: "Manager",
    department: "Administration",
    manager: "None",
    joiningDate: "2024-06-03",
    currentContract: "Full-time",
    workEmail: "email@company.com",
    workPhone: "+1 234 56789",
  },
  // add more mock employees as needed
];

function fullName(e: Employee) {
  return `${e.firstName} ${e.lastName}`.trim();
}
function fmt(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
}

// ✅ DEFAULT EXPORT *IS* A COMPONENT
export default function Page() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return EMPLOYEES.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Find Employee</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Search by name or employee ID</label>
        <input
          className="w-full rounded border p-2"
          placeholder="e.g., Harry Styles or 12345678"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Results */}
        <section className="rounded-lg border bg-white">
          <div className="border-b p-3 text-sm text-gray-600">
            {query.trim()
              ? results.length
                ? `${results.length} result(s)`
                : "No matches"
              : "Type a name to search"}
          </div>

          <ul className="max-h-[420px] overflow-auto p-2">
            {results.map((e) => (
              <li
                key={e.employeeId}
                className={`mb-2 flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-gray-50 ${
                  selected?.employeeId === e.employeeId ? "ring-2 ring-green-500" : ""
                }`}
                onClick={() => setSelected(e)}
              >
                <div>
                  <p className="font-medium">{fullName(e)}</p>
                  <p className="text-sm text-gray-600">ID: {e.employeeId}</p>
                  <p className="text-xs text-gray-500">
                    {e.position} • {e.department}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">Select</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Details */}
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">Employee Details</h2>
          {!selected ? (
            <p className="text-gray-600">Select an employee from the results to view details.</p>
          ) : (
            <div className="space-y-6">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-lg font-semibold">{fullName(selected)}</p>
                <p className="text-sm text-gray-600">Employee ID: {selected.employeeId}</p>
                <p className="text-sm text-gray-600">
                  {selected.position} • {selected.department}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <h3 className="font-medium">Personal</h3>
                  <p className="text-sm text-gray-700">Gender: {selected.gender}</p>
                  <p className="text-sm text-gray-700">DOB: {fmt(selected.dateOfBirth)}</p>
                  <p className="text-sm text-gray-700">Place of Birth: {selected.placeOfBirth}</p>
                  <p className="text-sm text-gray-700">Nationality: {selected.nationality}</p>
                  <p className="text-sm text-gray-700">Marital Status: {selected.materialStatus}</p>
                  <p className="text-sm text-gray-700">Passport: {selected.passportNumber}</p>
                  <p className="text-sm text-gray-700">Emergency: {selected.emergencyContact}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium">Contact</h3>
                  <p className="text-sm text-gray-700">Personal Email: {selected.personalEmail}</p>
                  <p className="text-sm text-gray-700">Phone: {selected.phoneNumber}</p>
                  <p className="text-sm text-gray-700">Work Email: {selected.workEmail}</p>
                  <p className="text-sm text-gray-700">Work Phone: {selected.workPhone}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium">Employment</h3>
                  <p className="text-sm text-gray-700">Manager: {selected.manager}</p>
                  <p className="text-sm text-gray-700">Joining Date: {fmt(selected.joiningDate)}</p>
                  <p className="text-sm text-gray-700">Contract: {selected.currentContract}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
