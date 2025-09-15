"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

/* ===== Types ===== */
type Permission =
  | "dashboard.view"
  | "employees.view"
  | "employees.edit"
  | "leaves.view"
  | "leaves.approve"
  | "requests.view"
  | "requests.approve"
  | "reports.view";

type Role = { id: string; name: "Admin" | "HR Staff" | "Manager" | "Employee" | string; permissions: Permission[] };
type Employee = { id: string; firstName: string; lastName: string; department: string; position: string; isAdmin?: boolean };
type Assignment = { employeeId: string; roleId: string };

/* ===== Demo Data ===== */
const EMPLOYEES: Employee[] = [
  { id: "000936770", firstName: "Darshan", lastName: "Dahal", department: "Development", position: "Software Engineer", isAdmin: true },
  { id: "000915041", firstName: "Abel", lastName: "Fekadu", department: "Development", position: "Software Engineer" },
  { id: "000957380", firstName: "Naya", lastName: "Bektenova", department: "Development", position: "Software Engineer" },
  { id: "000394998", firstName: "Hunter", lastName: "Tapping", department: "Development", position: "Software Engineer" },
  { id: "100000004", firstName: "Zayn", lastName: "Malik", department: "Marketing", position: "Digital Marketing Specialist" },
  { id: "100000005", firstName: "Harry", lastName: "Styles", department: "Administration", position: "Manager" },
];

const PERMS: { key: Permission; label: string }[] = [
  { key: "dashboard.view",   label: "View dashboard" },
  { key: "employees.view",   label: "View employees" },
  { key: "employees.edit",   label: "Edit employees" },
  { key: "leaves.view",      label: "View leaves" },
  { key: "leaves.approve",   label: "Approve leaves" },
  { key: "requests.view",    label: "View requests" },
  { key: "requests.approve", label: "Approve requests" },
  { key: "reports.view",     label: "View reports" },
];
const ALL_PERMS = PERMS.map(p => p.key);

/* ===== localStorage helpers ===== */
const ROLES_KEY = "maplehr_roles_simple_v2";
const ASSIGN_KEY = "maplehr_assign_simple_v2";
const uid = () => crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;

const seedRoles = (): Role[] => [
  { id: uid(), name: "Admin",    permissions: ALL_PERMS },
  { id: uid(), name: "HR Staff", permissions: ["dashboard.view","employees.view","employees.edit","leaves.view","leaves.approve","requests.view","requests.approve","reports.view"] },
  { id: uid(), name: "Manager",  permissions: ["dashboard.view","employees.view","leaves.view","leaves.approve","requests.view","requests.approve","reports.view"] },
  { id: uid(), name: "Employee", permissions: ["dashboard.view","employees.view","leaves.view","requests.view","reports.view"] },
];

function loadRoles(): Role[] {
  try { const raw = localStorage.getItem(ROLES_KEY); return raw ? JSON.parse(raw) as Role[] : []; }
  catch { return []; }
}
function saveRoles(r: Role[]) { localStorage.setItem(ROLES_KEY, JSON.stringify(r)); }

function defaultAssignments(roles: Role[]): Assignment[] {
  const admin = roles.find(r => r.name === "Admin")!;
  const emp   = roles.find(r => r.name === "Employee")!;
  return EMPLOYEES.map(e => ({ employeeId: e.id, roleId: e.isAdmin ? admin.id : emp.id }));
}
function loadAssignments(): Assignment[] {
  try { const raw = localStorage.getItem(ASSIGN_KEY); return raw ? JSON.parse(raw) as Assignment[] : []; }
  catch { return []; }
}
function saveAssignments(a: Assignment[]) { localStorage.setItem(ASSIGN_KEY, JSON.stringify(a)); }

/* ===== Component ===== */
export default function ManageRoles() {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [assign, setAssign] = React.useState<Assignment[]>([]);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let r = loadRoles(); if (!r.length) { r = seedRoles(); saveRoles(r); }
    setRoles(r);

    let a = loadAssignments(); if (!a.length) { a = defaultAssignments(r); saveAssignments(a); }
    setAssign(a);

    const first = EMPLOYEES.find(e => !e.isAdmin) ?? EMPLOYEES[0];
    setSelectedId(first?.id ?? null);
  }, []);

  const selectedEmp  = React.useMemo(() => EMPLOYEES.find(e => e.id === selectedId) || null, [selectedId]);
  const selectedAsg  = React.useMemo(() => assign.find(a => a.employeeId === selectedId) || null, [assign, selectedId]);
  const selectedRole = React.useMemo(() => roles.find(r => r.id === (selectedAsg?.roleId || "")) || null, [roles, selectedAsg]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = !q ? EMPLOYEES : EMPLOYEES.filter(e =>
      [e.firstName, e.lastName, e.department, e.position, e.id].join(" ").toLowerCase().includes(q)
    );
    return rows.slice().sort((a,b)=>`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [query]);

  const setAssignment = (empId: string, roleId: string) => {
    setAssign(prev => { const next = prev.map(x => x.employeeId === empId ? { ...x, roleId } : x); saveAssignments(next); return next; });
  };

  const togglePerm = (role: Role, perm: Permission) => {
    const next: Role = role.permissions.includes(perm)
      ? { ...role, permissions: role.permissions.filter(p => p !== perm) }
      : { ...role, permissions: [...role.permissions, perm] };
    setRoles(prev => { const arr = prev.map(r => r.id === role.id ? next : r); saveRoles(arr); return arr; });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left: Employee list */}
      <Card className="md:col-span-1">
        <CardHeader><CardTitle className="text-base">Employees</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by name, ID…" className="pl-9" />
          </div>
          <Separator />
          <ScrollArea className="h-[480px]">
            <div className="space-y-2">
              {filtered.map(e => {
                const asg = assign.find(a => a.employeeId === e.id);
                const role = roles.find(r => r.id === asg?.roleId);
                const active = selectedId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={()=>setSelectedId(e.id)}
                    className={`w-full rounded-md border p-3 text-left hover:bg-gray-50 ${active ? "ring-2 ring-green-500" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{e.firstName} {e.lastName}</div>
                        <div className="text-xs text-muted-foreground">{e.position} • {e.department}</div>
                      </div>
                      <Badge variant={e.isAdmin ? "default" : "secondary"}>{e.isAdmin ? "Admin" : role?.name ?? "—"}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Role + flat permissions (labels only) */}
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Manage Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!selectedEmp || !selectedRole ? (
            <div className="text-sm text-muted-foreground">Select an employee to manage access.</div>
          ) : (
            <>
              <div className="rounded-md bg-gray-50 p-3">
                <div className="font-semibold">{selectedEmp.firstName} {selectedEmp.lastName}</div>
                <div className="text-sm text-muted-foreground">{selectedEmp.position} • {selectedEmp.department}</div>
                {selectedEmp.isAdmin && <div className="mt-1 text-xs text-purple-700">Admin has all permissions. Editing disabled.</div>}
              </div>

              {/* Assign existing role */}
              <div className="grid gap-2 md:w-96">
                <label className="text-sm font-medium">Assigned role</label>
                <Select value={selectedRole.id} onValueChange={(v)=>!selectedEmp.isAdmin && setAssignment(selectedEmp.id, v)}>
                  <SelectTrigger disabled={selectedEmp.isAdmin}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.filter(r=>r.name!=="Admin").map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* No debug keys shown here */}
              <div className="grid gap-2 md:grid-cols-2">
                {PERMS.map(p => {
                  const checked = selectedRole.permissions.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className={`flex items-center gap-3 rounded-md border p-2 ${checked ? "bg-green-50 border-green-200" : ""} ${selectedEmp.isAdmin ? "opacity-60" : ""}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => !selectedEmp.isAdmin && togglePerm(selectedRole, p.key)}
                        disabled={selectedEmp.isAdmin}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <Button className="bg-green-600 hover:bg-green-700" disabled={selectedEmp.isAdmin}>
                  Save changes
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
