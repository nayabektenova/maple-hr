"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const employees = [
  { id: "12345678", firstName: "Abel", lastName: "Fekadu", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Naya", lastName: "Bektenova", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Hunter", lastName: "Tapping", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Darshan", lastName: "Dahal", email: "email@company.com", phone: "+1 234 56789", department: "Development", position: "Software Engineer" },
  { id: "12345678", firstName: "Daniel", lastName: "Williams", email: "email@company.com", phone: "+1 234 56789", department: "Maintenance", position: "Janitor assistant" },
  { id: "12345678", firstName: "Thomas", lastName: "Johnson", email: "email@company.com", phone: "+1 234 56789", department: "Maintenance", position: "Janitor" },
  { id: "12345678", firstName: "Jack", lastName: "Mason", email: "email@company.com", phone: "+1 234 56789", department: "Cybersecurity", position: "Cybersecurity Manager" },
  { id: "12345678", firstName: "Zayn", lastName: "Malik", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Digital Marketing Specialist" },
  { id: "12345678", firstName: "Harry", lastName: "Styles", email: "email@company.com", phone: "+1 234 56789", department: "Administration", position: "Manager" },
  { id: "12345678", firstName: "Liam", lastName: "Payne", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Coordinator" },
  { id: "12345678", firstName: "Selena", lastName: "Gomez", email: "email@company.com", phone: "+1 234 56789", department: "Marketing", position: "Communications Specialist" },
  { id: "12345678", firstName: "Taylor", lastName: "Swift", email: "email@company.com", phone: "+1 234 56789", department: "Finance", position: "Accountant" },
  { id: "12345678", firstName: "Saul", lastName: "Mullins", email: "email@company.com", phone: "+1 234 56789", department: "Administration", position: "Administrative Assistant" },
  { id: "12345678", firstName: "Amirah", lastName: "Vincent", email: "email@company.com", phone: "+1 234 56789", department: "Finance", position: "Analyst" },
]

export function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [alphaSort, setAlphaSort] = useState(false)
  const [downloadType, setDownloadType] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [positionFilter, setPositionFilter] = useState("")

  const departments = Array.from(new Set(employees.map((e) => e.department)))
  const positions = Array.from(new Set(employees.map((e) => e.position)))

  const filteredEmployees = useMemo(() => {
    let rows = employees.filter((e) =>
      `${e.id} ${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (departmentFilter) rows = rows.filter((e) => e.department === departmentFilter)
    if (positionFilter) rows = rows.filter((e) => e.position === positionFilter)
    if (alphaSort) rows = rows.sort((a, b) => a.firstName.localeCompare(b.firstName))
    return rows
  }, [searchTerm, departmentFilter, positionFilter, alphaSort])

  const handleDownload = () => {
    if (!downloadType) return
    if (downloadType === "CSV") {
      const header = "id,firstName,lastName,email,phone,department,position\n"
      const rows = filteredEmployees
        .map((e) => `${e.id},${e.firstName},${e.lastName},${e.email},${e.phone},${e.department},${e.position}`)
        .join("\n")
      const blob = new Blob([header + rows], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "employees.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else {
      console.log(downloadType + " download coming soon")
    }
  }

  const CustomSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative inline-block">
      <select {...props} className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm appearance-none" />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</span>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <CustomSelect value={downloadType} onChange={(e) => setDownloadType(e.target.value)}>
            <option value="">Select type of data</option>
            <option value="CSV">CSV</option>
            <option value="Excel">Excel (.xlsx)</option>
            <option value="PDF">PDF</option>
          </CustomSelect>
          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleDownload}>Apply</Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID, Name, Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CustomSelect value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </CustomSelect>

          <CustomSelect value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="">Position</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </CustomSelect>

          <div className="flex items-center gap-2">
            <Checkbox id="alphabetic" checked={alphaSort} onCheckedChange={() => setAlphaSort(!alphaSort)} />
            <label htmlFor="alphabetic" className="text-sm text-gray-600">Alphabetic order</label>
          </div>
        </div>
      </div>

      <Table className="min-w-full table-fixed">
        <TableHeader>
          <TableRow className="pointer-events:none;">
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-36">First Name</TableHead>
            <TableHead className="w-36">Last Name</TableHead>
            <TableHead className="w-32">ID</TableHead>
            <TableHead className="w-64">Email</TableHead>
            <TableHead className="w-40">Phone number</TableHead>
            <TableHead className="w-40">Department</TableHead>
            <TableHead className="w-48">Position</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((emp, i) => (
            <TableRow key={i} className="hover:bg-gray-50">
              <TableCell className="w-12">
                {emp.firstName === "Harry" && emp.lastName === "Styles" ? (
                  <Link href={`/employees/${emp.id}`}>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="font-medium w-36">{emp.firstName}</TableCell>
              <TableCell className="w-36">{emp.lastName}</TableCell>
              <TableCell className="text-gray-600 w-32">{emp.id}</TableCell>
              <TableCell className="text-gray-600 w-64">{emp.email}</TableCell>
              <TableCell className="text-gray-600 w-40">{emp.phone}</TableCell>
              <TableCell className="text-gray-600 w-40">{emp.department}</TableCell>
              <TableCell className="text-gray-600 w-48">{emp.position}</TableCell>
              <TableCell className="w-12"></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
