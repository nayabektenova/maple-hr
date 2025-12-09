// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== TYPES ====================
export type Permission = {
  id: number;
  key: string;
  label: string;
  category: string;
};

export type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
};

export type EmployeeWithRole = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string;
  position: string | null;
  role_id: number | null;
  role?: Role;
  manager_name: string | null;
};

export type RoleAuditLog = {
  id: number;
  employee_id: string;
  old_role_id: number | null;
  new_role_id: number | null;
  changed_by: string;
  changed_at: string;
  reason: string | null;
};

// ==================== API FUNCTIONS ====================

export async function fetchRolesWithPermissions(): Promise<Role[]> {
  const { data, error } = await supabase
    .from("roles")
    .select(`
      id,
      name,
      description,
      created_at,
      updated_at,
      role_permissions(
        permission_id,
        permissions(id, key, label, category)
      )
    `);

  if (error) throw new Error(`Failed to fetch roles: ${error.message}`);

  return (data || []).map((role: any) => ({
    ...role,
    permissions: role.role_permissions.map((rp: any) => rp.permissions),
  }));
}

export async function fetchEmployeesWithRoles(): Promise<EmployeeWithRole[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(`
      id,
      first_name,
      last_name,
      email,
      department,
      position,
      role_id,
      manager_name,
      roles:role_id(id, name, description, created_at, updated_at)
    `)
    .order("last_name", { ascending: true });

  if (error) throw new Error(`Failed to fetch employees: ${error.message}`);

  return (data || []).map((emp: any) => ({
    ...emp,
    role: Array.isArray(emp.roles) ? emp.roles[0] : emp.roles,
  }));
}

export async function updateEmployeeRole(
  employeeId: string,
  newRoleId: number,
  changedBy: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  // Get old role
  const { data: empData } = await supabase
    .from("employees")
    .select("role_id")
    .eq("id", employeeId)
    .single();

  // Update employee
  const { error: updateError } = await supabase
    .from("employees")
    .update({ role_id: newRoleId })
    .eq("id", employeeId);

  if (updateError) throw new Error(updateError.message);

  // Log the change
  const { error: logError } = await supabase
    .from("role_audit_log")
    .insert({
      employee_id: employeeId,
      old_role_id: empData?.role_id,
      new_role_id: newRoleId,
      changed_by: changedBy,
      reason,
    });

  if (logError) console.warn("Failed to log role change:", logError);

  return {
    success: true,
    message: "Role updated successfully",
  };
}

export async function fetchAuditLogs(limit = 50): Promise<RoleAuditLog[]> {
  const { data, error } = await supabase
    .from("role_audit_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);

  return data || [];
}

export async function createRole(
  name: string,
  description: string,
  permissionIds: number[]
): Promise<Role> {
  const { data, error } = await supabase
    .from("roles")
    .insert({ name, description })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Assign permissions
  if (permissionIds.length > 0) {
    const { error: permError } = await supabase
      .from("role_permissions")
      .insert(
        permissionIds.map((pid) => ({ role_id: data.id, permission_id: pid }))
      );

    if (permError) console.warn("Failed to assign permissions:", permError);
  }

  return data;
}

// ==================== BATCH OPERATIONS ====================

export async function bulkUpdateRoles(
  assignments: { employeeId: string; roleId: number }[],
  changedBy: string,
  reason?: string
): Promise<void> {
  const promises = assignments.map((a) =>
    updateEmployeeRole(a.employeeId, a.roleId, changedBy, reason)
  );

  const results = await Promise.allSettled(promises);
  const failed = results.filter((r) => r.status === "rejected");

  if (failed.length > 0) {
    console.error(`${failed.length} role updates failed`);
    throw new Error(`Failed to update ${failed.length} roles`);
  }
}

// ==================== SEARCH & FILTER ====================

export async function searchEmployeesByRoleOrDept(
  query: string,
  roleId?: number,
  department?: string
): Promise<EmployeeWithRole[]> {
  let q = supabase
    .from("employees")
    .select(`
      id,
      first_name,
      last_name,
      email,
      department,
      position,
      role_id,
      manager_name,
      roles:role_id(id, name, description, created_at, updated_at)
    `);

  if (query) {
    q = q.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,id.ilike.%${query}%`
    );
  }

  if (roleId) {
    q = q.eq("role_id", roleId);
  }

  if (department) {
    q = q.eq("department", department);
  }

  const { data, error } = await q.order("last_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((emp: any) => ({
    ...emp,
    role: Array.isArray(emp.roles) ? emp.roles[0] : emp.roles,
  }));
}