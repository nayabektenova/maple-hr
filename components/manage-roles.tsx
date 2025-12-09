// components/manage-roles-enhanced.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";
import {
  fetchRolesWithPermissions,
  fetchEmployeesWithRoles,
  updateEmployeeRole,
  fetchAuditLogs,
  searchEmployeesByRoleOrDept,
  type Role,
  type Permission,
  type EmployeeWithRole,
  type RoleAuditLog,
} from "@/lib/supabaseClient";

type ChangeSummary = {
  employeeId: string;
  oldRoleId: number | null;
  newRoleId: number;
};

export default function ManageRolesEnhanced() {
  // Data states
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRole[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<RoleAuditLog[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);

  // UI states
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Filter & search
  const [query, setQuery] = React.useState("");
  const [filterRole, setFilterRole] = React.useState<string>("");
  const [filterDept, setFilterDept] = React.useState<string>("");

  // Selection
  const [selectedEmpId, setSelectedEmpId] = React.useState<string | null>(null);
  const [changes, setChanges] = React.useState<Map<string, ChangeSummary>>(
    new Map()
  );

  // Tab state
  const [activeTab, setActiveTab] = React.useState<"manage" | "audit">(
    "manage"
  );

  // Load initial data
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [rolesData, employeesData, auditData] = await Promise.all([
          fetchRolesWithPermissions(),
          fetchEmployeesWithRoles(),
          fetchAuditLogs(50),
        ]);

        setRoles(rolesData);
        setEmployees(employeesData);
        setAuditLogs(auditData);

        // Extract unique permissions from roles
        const allPerms = new Set<Permission>();
        rolesData.forEach((r) =>
          r.permissions?.forEach((p) => allPerms.add(p))
        );
        setPermissions(Array.from(allPerms));

        // Set first employee as selected
        if (employeesData.length > 0) {
          setSelectedEmpId(employeesData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtered employees
  const filtered = React.useMemo(async () => {
    const dept = filterDept || undefined;
    const roleId = filterRole ? parseInt(filterRole) : undefined;

    try {
      if (query.trim() || roleId || dept) {
        return await searchEmployeesByRoleOrDept(
          query.trim().toLowerCase(),
          roleId,
          dept
        );
      }
      return employees;
    } catch (err) {
      console.error("Search error:", err);
      return employees;
    }
  }, [query, filterRole, filterDept, employees]);

  // Selected employee & role
  const selectedEmp = React.useMemo(
    () => employees.find((e) => e.id === selectedEmpId) || null,
    [selectedEmpId, employees]
  );

  const selectedRole = React.useMemo(
    () =>
      selectedEmp?.role ||
      roles.find((r) => r.id === changes.get(selectedEmpId!)?.newRoleId),
    [selectedEmp, selectedEmpId, roles, changes]
  );

  // Unique departments
  const departments = React.useMemo(
    () =>
      [...new Set(employees.map((e) => e.department))].filter(Boolean).sort(),
    [employees]
  );

  // Handle role change
  const handleRoleChange = (newRoleId: number) => {
    if (!selectedEmp) return;

    setChanges((prev) => {
      const next = new Map(prev);
      next.set(selectedEmp.id, {
        employeeId: selectedEmp.id,
        oldRoleId: selectedEmp.role_id,
        newRoleId,
      });
      return next;
    });
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (changes.size === 0) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      for (const change of changes.values()) {
        await updateEmployeeRole(
          change.employeeId,
          change.newRoleId,
          "current_user", // Replace with actual current user
          "Role changed via admin panel"
        );
      }

      // Refresh data
      const updatedEmployees = await fetchEmployeesWithRoles();
      const updatedAudit = await fetchAuditLogs(50);

      setEmployees(updatedEmployees);
      setAuditLogs(updatedAudit);
      setChanges(new Map());
      setSuccess(`Successfully updated ${changes.size} role(s)`);

      // Refresh selected employee
      const updated = updatedEmployees.find((e) => e.id === selectedEmpId);
      if (updated) {
        setSelectedEmpId(updated.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    setChanges(new Map());
  };

  if (loading && employees.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-600" />
            <p className="text-sm text-gray-500">
              Loading roles and permissions...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "manage"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Manage Access
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "audit"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Manage Access Tab */}
      {activeTab === "manage" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Employee list */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, ID…"
                  className="pl-9 text-sm"
                />
              </div>

              <Separator />

              {/* Filters */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                  <Filter className="h-3 w-3" /> Filters
                </label>

                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Employee list */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pt-2">
                  {Array.isArray(filtered) &&
                    filtered.map((e) => {
                      const active = selectedEmpId === e.id;
                      const hasChange = changes.has(e.id);
                      const change = changes.get(e.id);
                      const currentRole = roles.find(
                        (r) => r.id === (change?.newRoleId || e.role_id)
                      );

                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEmpId(e.id)}
                          className={`w-full rounded-md border p-3 text-left transition ${
                            active
                              ? "ring-2 ring-green-500 bg-green-50 border-green-200"
                              : "hover:bg-gray-50"
                          } ${
                            hasChange ? "bg-yellow-50 border-yellow-200" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-medium text-sm">
                                {e.first_name} {e.last_name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {e.position} • {e.department}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs">
                                {currentRole?.name || "Unassigned"}
                              </Badge>
                              {hasChange && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full bg-yellow-500"
                                  title="Changed"
                                />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Role + permissions */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Manage Roles & Permissions
              </CardTitle>
              {changes.size > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {changes.size} pending
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {!selectedEmp ? (
                <div className="text-sm text-gray-500">
                  Select an employee to manage access.
                </div>
              ) : (
                <>
                  {/* Employee info */}
                  <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                    <div className="font-semibold text-gray-900">
                      {selectedEmp.first_name} {selectedEmp.last_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedEmp.position} • {selectedEmp.department}
                    </div>
                    {selectedEmp.email && (
                      <div className="text-xs text-gray-500 mt-2">
                        {selectedEmp.email}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Role assignment */}
                  <div className="grid gap-2 md:w-96">
                    <label className="text-sm font-medium">Assigned role</label>
                    {selectedEmp && selectedEmp.role_id ? (
                      <Select
                        value={(
                          changes.get(selectedEmpId!)?.newRoleId ||
                          selectedEmp.role_id
                        ).toString()}
                        onValueChange={(v) => handleRoleChange(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.name}
                              {r.description && (
                                <span className="text-xs ml-1">
                                  ({r.description})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                        Employee has no role assigned. Assign one from the list
                        below.
                      </div>
                    )}
                  </div>

                  {/* Role description */}
                  {selectedRole && (
                    <div className="rounded-md bg-blue-50 p-3 border border-blue-200 text-sm">
                      <div className="font-medium text-blue-900">
                        {selectedRole.description}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Permissions grid */}
                  {selectedRole &&
                  selectedRole.permissions &&
                  selectedRole.permissions.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium mb-3">
                        Permissions in this role
                      </div>
                      <div className="space-y-2">
                        {/* Group by category */}
                        {Array.from(
                          new Map(
                            selectedRole.permissions.map((p) => [p.category, p])
                          ).entries()
                        ).map(([category, firstPerm]) => {
                          const catPerms = selectedRole.permissions!.filter(
                            (p) => p.category === category
                          );
                          return (
                            <div key={category}>
                              <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                {category}
                              </div>
                              <div className="grid gap-2 md:grid-cols-2 mb-3">
                                {catPerms.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-2 rounded-md border bg-green-50 border-green-200 p-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                      {p.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No permissions assigned to this role.
                    </div>
                  )}

                  <Separator />

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveChanges}
                      disabled={changes.size === 0 || loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Save changes ({changes.size})
                    </Button>
                    {changes.size > 0 && (
                      <Button onClick={handleDiscardChanges} variant="outline">
                        Discard
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Role Change Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Employee</th>
                    <th className="text-left p-3 font-medium">Previous Role</th>
                    <th className="text-left p-3 font-medium">New Role</th>
                    <th className="text-left p-3 font-medium">Changed By</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-500">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const oldRole = roles.find(
                        (r) => r.id === log.old_role_id
                      );
                      const newRole = roles.find(
                        (r) => r.id === log.new_role_id
                      );
                      const emp = employees.find(
                        (e) => e.id === log.employee_id
                      );

                      return (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            {emp
                              ? `${emp.first_name} ${emp.last_name}`
                              : "Unknown"}
                          </td>
                          <td className="p-3">
                            {oldRole ? (
                              <Badge variant="outline">{oldRole.name}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge>{newRole?.name}</Badge>
                          </td>
                          <td className="p-3">{log.changed_by}</td>
                          <td className="p-3 text-xs text-gray-600">
                            {new Date(log.changed_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            {log.reason || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
