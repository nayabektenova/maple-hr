"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ================= Types ================= */
type Permission =
  | "dashboard.view"
  | "schedule.view"
  | "schedule.manage"
  | "employees.view"
  | "employees.edit"
  | "reports.view"
  | "reports.generate"
  | "leaves.view"
  | "leaves.approve"
  | "finances.view"
  | "finances.edit"
  | "survey.manage"
  | "requests.view"
  | "requests.approve"
  | "roles.manage";

type Role = {
  id: string;
  name: "Admin" | "HR Staff" | "Manager" | "Employee" | string;
  description?: string;
  permissions: Permission[];
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  isAdmin?: boolean; // Admins are read-only in this UI
};

type Assignment = {
  employeeId: string;
  roleId: string; // references Role.id
};

type PermissionGroup = {
  label: string;
  items: { key: Permission; label: string }[];
};

/** ================= Permission catalog ================= */
const PERMISSION_GROUPS: PermissionGroup[] = [
  { label: "General", items: [{ key: "dashboard.view", label: "View dashboard" }] },
  {
    label: "Schedule",
    items: [
      { key: "schedule.view", label: "View schedule" },
      { key: "schedule.manage", label: "Create/Edit schedule" },
    ],
  },
  {
    label: "Employees",
    items: [
      { key: "employees.view", label: "View employees" },
      { key: "employees.edit", label: "Create/Edit employees" },
    ],
  },
  {
    label: "Reports",
    items: [
      { key: "reports.view", label: "View reports" },
      { key: "reports.generate", label: "Generate/export reports" },
    ],
  },
  {
    label: "Leaves",
    items: [
      { key: "leaves.view", label: "View leave balances/requests" },
      { key: "leaves.approve", label: "Approve/decline leaves" },
    ],
  },
  {
    label: "Finances",
    items: [
      { key: "finances.view", label: "View payroll/finance data" },
      { key: "finances.edit", label: "Edit payroll/finance data" },
    ],
  },
  { label: "Surveys", items: [{ key: "survey.manage", label: "Manage engagement surveys" }] },
  {
    label: "Requests",
    items: [
      { key: "requests.view", label: "View requests" },
      { key: "requests.approve", label: "Approve/decline requests" },
    ],
  },
  { label: "Administration", items: [{ key: "roles.manage", label: "Manage roles & permissions" }] },
];

const allPermissions = (): Permission[] =>
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

/** ================= Sample Employees ================= */
const EMPLOYEES: Employee[] = [
  { id: "000915041", firstName: "Abel",   lastName: "Fekadu",    department: "Development",   position: "Software Engineer" },
  { id: "000957380", firstName: "Naya",   lastName: "Bektenova", department: "Development",   position: "Software Engineer" },
  { id: "000394998", firstName: "Hunter", lastName: "Tapping",   department: "Development",   position: "Software Engineer" },
  { id: "000936770", firstName: "Darshan",lastName: "Dahal",     department: "Development",   position: "Software Engineer", isAdmin: true }, // Admin example
  { id: "100000001", firstName: "Daniel", lastName: "Williams",  department: "Maintenance",   position: "Janitor assistant" },
  { id: "100000002", firstName: "Thomas", lastName: "Johnson",   department: "Maintenance",   position: "Janitor" },
  { id: "100000003", firstName: "Jack",   lastName: "Mason",     department: "Cybersecurity", position: "Cybersecurity Manager" },
  { id: "100000004", firstName: "Zayn",   lastName: "Malik",     department: "Marketing",     position: "Digital Marketing Specialist" },
  { id: "100000005", firstName: "Harry",  lastName: "Styles",    department: "Administration",position: "Manager" },
];

const ROLES_KEY = "maplehr_roles_catalog_v2";
const ASSIGN_KEY = "maplehr_user_assignments_v2";

/** ================= Helpers ================= */
const uid = () => globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;

const seedDefaultRoles = (): Role[] => ([
  { id: uid(), name: "Admin",    description: "Full access (read-only here)", permissions: allPermissions() },
  { id: uid(), name: "HR Staff", description: "HR daily operations", permissions: [
    "dashboard.view","employees.view","employees.edit","leaves.view","leaves.approve",
    "reports.view","reports.generate","survey.manage","requests.view","requests.approve",
  ]},
  { id: uid(), name: "Manager",  description: "Team management & approvals", permissions: [
    "dashboard.view","schedule.view","employees.view","leaves.view","leaves.approve",
    "reports.view","requests.view","requests.approve",
  ]},
  { id: uid(), name: "Employee", description: "Self-service access", permissions: [
    "dashboard.view","schedule.view","employees.view","leaves.view","reports.view","requests.view",
  ]},
]);

function loadRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    const arr = raw ? (JSON.parse(raw) as Role[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveRoles(roles: Role[]) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
function defaultAssignments(roles: Role[]): Assignment[] {
  const adminRole = roles.find(r => r.name === "Admin")!;
  const employeeRole = roles.find(r => r.name === "Employee")!;
  return EMPLOYEES.map(e => ({
    employeeId: e.id,
    roleId: e.isAdmin ? adminRole.id : employeeRole.id,
  }));
}
function loadAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(ASSIGN_KEY);
    const arr = raw ? (JSON.parse(raw) as Assignment[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveAssignments(asg: Assignment[]) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(asg));
}
const empName = (e: Employee) => `${e.firstName} ${e.lastName}`;

/** ================= Page ================= */
export default function ManagerRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Load/seed catalog + assignments
  useEffect(() => {
    let currentRoles = loadRoles();
    if (currentRoles.length === 0) {
      currentRoles = seedDefaultRoles();
      saveRoles(currentRoles);
    }
    setRoles(currentRoles);

    let currentAsg = loadAssignments();
    if (currentAsg.length === 0) {
      currentAsg = defaultAssignments(currentRoles);
      saveAssignments(currentAsg);
    } else {
      // Ensure every employee has an assignment (in case list changed)
      const missing = EMPLOYEES.filter(e => !currentAsg.some(a => a.employeeId === e.id))
        .map(e => ({
          employeeId: e.id,
          roleId: (e.isAdmin
            ? currentRoles.find(r => r.name === "Admin")!.id
            : currentRoles.find(r => r.name === "Employee")!.id),
        }));
      if (missing.length) {
        currentAsg = [...currentAsg, ...missing];
        saveAssignments(currentAsg);
      }
    }
    setAssignments(currentAsg);

    // Preselect first non-admin
    const firstNonAdmin = EMPLOYEES.find(e => !e.isAdmin);
    setSelectedEmpId(firstNonAdmin?.id ?? EMPLOYEES[0]?.id ?? null);
  }, []);

  const selectedEmp = useMemo(
    () => EMPLOYEES.find(e => e.id === selectedEmpId) ?? null,
    [selectedEmpId]
  );
  const selectedAsg = useMemo(
    () => assignments.find(a => a.employeeId === selectedEmpId) ?? null,
    [assignments, selectedEmpId]
  );
  const selectedRole = useMemo(
    () => roles.find(r => r.id === (selectedAsg?.roleId ?? "")) ?? null,
    [roles, selectedAsg]
  );

  const filteredEmps = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = !q
      ? EMPLOYEES
      : EMPLOYEES.filter(e =>
          [e.firstName, e.lastName, e.department, e.position, e.id]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
    return rows.slice().sort((a, b) => empName(a).localeCompare(empName(b)));
  }, [query]);

  /** ===== Actions ===== */
  function updateAssignment(roleId: string) {
    if (!selectedEmp || !selectedAsg) return;
    if (selectedEmp.isAdmin) return; // Admins not editable here
    setAssignments(prev => {
      const next = prev.map(a => a.employeeId === selectedEmp.id ? { ...a, roleId } : a);
      saveAssignments(next);
      return next;
    });
    setNotice("Assignment saved (local only).");
  }

  function toggleRolePermission(role: Role, perm: Permission) {
    const has = role.permissions.includes(perm);
    const next: Role = {
      ...role,
      permissions: has ? role.permissions.filter(p => p !== perm) : [...role.permissions, perm],
    };
    setRoles(prev => {
      const arr = prev.map(r => r.id === role.id ? next : r);
      saveRoles(arr);
      return arr;
    });
    setNotice("Role permissions updated (local only).");
  }

  function enableGroup(role: Role, group: PermissionGroup, enable: boolean) {
    const set = new Set(role.permissions);
    group.items.forEach(({ key }) => (enable ? set.add(key) : set.delete(key)));
    const next: Role = { ...role, permissions: Array.from(set) };
    setRoles(prev => {
      const arr = prev.map(r => (r.id === role.id ? next : r));
      saveRoles(arr);
      return arr;
    });
    setNotice(enable ? "Enabled group (local only)." : "Disabled group (local only).");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Assign Roles & Permissions</h1>
        <p className="text-sm text-gray-600">
          Search an employee, assign an existing role, edit that role’s permissions, and save changes. (Frontend only — localStorage)
        </p>
      </header>

      {notice && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {notice}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Employee search/list */}
        <aside className="rounded-lg border bg-white">
          <div className="border-b p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded border p-2 text-sm"
              placeholder="Search employees by name, ID, dept, position…"
            />
          </div>
          <ul className="max-h-[520px] overflow-auto p-2">
            {filteredEmps.map((e) => {
              const asg = assignments.find(a => a.employeeId === e.id);
              const role = roles.find(r => r.id === asg?.roleId);
              const isSel = selectedEmpId === e.id;
              return (
                <li key={e.id}>
                  <button
                    className={`flex w-full items-start justify-between gap-2 rounded-md border p-3 text-left hover:bg-gray-50 ${
                      isSel ? "ring-2 ring-green-500" : ""
                    }`}
                    onClick={() => setSelectedEmpId(e.id)}
                  >
                    <div>
                      <p className="font-medium">{empName(e)}</p>
                      <p className="text-xs text-gray-600">{e.position} • {e.department}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      e.isAdmin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
                    }`}>
                      {e.isAdmin ? "Admin" : role?.name ?? "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right: Assign existing role & edit its permissions */}
        <section className="md:col-span-2 rounded-lg border bg-white p-4">
          {!selectedEmp || !selectedAsg ? (
            <p className="text-gray-600">Select an employee to manage roles & permissions.</p>
          ) : (
            <>
              {/* Employee header */}
              <div className="mb-4 rounded-md bg-gray-50 p-3">
                <p className="text-lg font-semibold">{empName(selectedEmp)}</p>
                <p className="text-sm text-gray-600">{selectedEmp.position} • {selectedEmp.department}</p>
                {selectedEmp.isAdmin && (
                  <p className="mt-1 text-xs text-purple-800">
                    This user is an Admin and already has all permissions. Assignments are disabled.
                  </p>
                )}
              </div>

              {/* Assign existing role */}
              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Assign existing role</label>
                  <select
                    className="w-full rounded border p-2"
                    disabled={selectedEmp.isAdmin}
                    value={selectedRole?.id ?? ""}
                    onChange={(e) => updateAssignment(e.target.value)}
                  >
                    <option value="" disabled>Select a role…</option>
                    {roles
                      .filter(r => r.name !== "Admin") // Admin not assignable
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-600">
                    {selectedRole ? (selectedRole.description || "—") : "—"}
                  </p>
                </div>
              </div>

              {/* Edit CURRENT role permissions */}
              {selectedRole && (
                <>
                  <h3 className="mb-2 text-lg font-medium">Edit current role: {selectedRole.name}</h3>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      disabled={selectedEmp.isAdmin}
                      onClick={() => {
                        const next: Role = { ...selectedRole, permissions: allPermissions() };
                        setRoles(prev => {
                          const arr = prev.map(r => (r.id === next.id ? next : r));
                          saveRoles(arr);
                          return arr;
                        });
                        setNotice("Granted all permissions to the role (local only).");
                      }}
                    >
                      Grant all
                    </button>
                    <button
                      className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                      disabled={selectedEmp.isAdmin}
                      onClick={() => {
                        const next: Role = { ...selectedRole, permissions: [] };
                        setRoles(prev => {
                          const arr = prev.map(r => (r.id === next.id ? next : r));
                          saveRoles(arr);
                          return arr;
                        });
                        setNotice("Cleared all permissions from the role (local only).");
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.label} className="rounded border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">{group.label}</span>
                          <div className="flex gap-2 text-xs">
                            <button
                              className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                              disabled={selectedEmp.isAdmin}
                              onClick={() => enableGroup(selectedRole, group, true)}
                            >
                              Enable group
                            </button>
                            <button
                              className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                              disabled={selectedEmp.isAdmin}
                              onClick={() => enableGroup(selectedRole, group, false)}
                            >
                              Disable group
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {group.items.map((item) => {
                            const checked = selectedRole.permissions.includes(item.key);
                            return (
                              <label
                                key={item.key}
                                className={`flex items-center gap-3 rounded-md border p-2 ${
                                  checked ? "bg-green-50 border-green-200" : ""
                                } ${selectedEmp.isAdmin ? "opacity-60" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={selectedEmp.isAdmin}
                                  onChange={() => toggleRolePermission(selectedRole, item.key)}
                                />
                                <span className="text-sm">{item.label}</span>
                                <code className="ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                  {item.key}
                                </code>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save button (changes are already persisted; this is UX feedback) */}
                  <div className="mt-4">
                    <button
                      className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                      onClick={() => setNotice("Changes saved. (Local only — frontend demo)")}
                      disabled={selectedEmp.isAdmin}
                    >
                      Save changes
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
