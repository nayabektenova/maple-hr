// types/employee.ts
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string | null;
  email: string;
  phone: string | null;
  position: string | null;
  gender: string | null;
  personal_email: string | null;
  phone_number: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  marital_status: string | null;
  emergency_contact: string | null;
  nationality: string | null;
  manager_name: string | null;
  joining_date: string | null;
  current_contract: string | null;
  work_email: string | null;
  work_phone: string | null;
  role_id: number | null;
  role: string | null;
  branch_id: number | null;
}
