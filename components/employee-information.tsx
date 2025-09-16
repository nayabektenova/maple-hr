"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Edit2, FileText } from "lucide-react"

interface EmployeeInformationProps {
  employeeId: string
}

// Sample employee data - in a real app, this would come from an API
const sampleEmployeeData = {
  firstName: "Harry",
  lastName: "Styles",
  employeeId: "12345678",
  gender: "Male",
  personalEmail: "email@personal.com",
  phoneNumber: "+1 234 56789",
  passportNumber: "12345678",
  dateOfBirth: "1994-02-01",
  placeOfBirth: "UK",
  maritalStatus: "Single",
  emergencyContact: "+1 234 56789",
  nationality: "UK",
  position: "Manager",
  department: "Administration",
  manager: "None",
  joiningDate: "2024-06-03",
  currentContract: "Full-time",
  workEmail: "email@company.com",
  workPhone: "+1 234 56789",
  documents: [{ name: "Passport.pdf", type: "pdf" }],
}

export function EmployeeInformation({ employeeId }: EmployeeInformationProps) {
  const [employeeData, setEmployeeData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    gender: "",
    personalEmail: "",
    phoneNumber: "",
    passportNumber: "",
    dateOfBirth: "",
    placeOfBirth: "",
    maritalStatus: "",
    emergencyContact: "",
    nationality: "",
    position: "",
    department: "",
    manager: "",
    joiningDate: "",
    currentContract: "",
    workEmail: "",
    workPhone: "",
    documents: [] as Array<{ name: string; type: string }>,
  })

  // Load employee data on component mount
  useEffect(() => {
    // In a real app, you would fetch data based on employeeId
    setEmployeeData(sampleEmployeeData)
  }, [employeeId])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
              <Link href={`/employees/${employeeId}/edit`}>
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input id="firstName" value={employeeData.firstName} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber" className="text-sm font-medium">
                    Passport Number
                  </Label>
                  <Input
                    id="passportNumber"
                    value={employeeData.passportNumber}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input id="lastName" value={employeeData.lastName} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of birth
                  </Label>
                  <div className="relative">
                    <Input id="dateOfBirth" value={employeeData.dateOfBirth} readOnly className="w-full bg-gray-50" />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium">
                    Employee ID
                  </Label>
                  <Input id="employeeId" value={employeeData.employeeId} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth" className="text-sm font-medium">
                    Place of birth
                  </Label>
                  <Select value={employeeData.placeOfBirth} disabled>
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender
                  </Label>
                  <Input id="gender" value={employeeData.gender} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus" className="text-sm font-medium">
                    Marital status
                  </Label>
                  <Input
                    id="maritalStatus"
                    value={employeeData.maritalStatus}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="personalEmail" className="text-sm font-medium">
                    Personal Email
                  </Label>
                  <Input id="personalEmail" value={employeeData.personalEmail} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-sm font-medium">
                    Emergency contact
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={employeeData.emergencyContact}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone number
                  </Label>
                  <Input id="phoneNumber" value={employeeData.phoneNumber} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-sm font-medium">
                    Nationality (Country)
                  </Label>
                  <Select value={employeeData.nationality} disabled>
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position
                  </Label>
                  <Input id="position" value={employeeData.position} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <Input id="department" value={employeeData.department} readOnly className="w-full bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-sm font-medium">
                    Manager
                  </Label>
                  <Input id="manager" value={employeeData.manager} readOnly className="w-full bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate" className="text-sm font-medium">
                    Joining Date
                  </Label>
                  <div className="relative">
                    <Input id="joiningDate" value={employeeData.joiningDate} readOnly className="w-full bg-gray-50" />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentContract" className="text-sm font-medium">
                    Current Contract
                  </Label>
                  <Input
                    id="currentContract"
                    value={employeeData.currentContract}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEmail" className="text-sm font-medium">
                    Work Email
                  </Label>
                  <Input id="workEmail" value={employeeData.workEmail} readOnly className="w-full bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="workPhone" className="text-sm font-medium">
                    Work Phone
                  </Label>
                  <Input id="workPhone" value={employeeData.workPhone} readOnly className="w-full bg-gray-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploaded Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeData.documents.map((document, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{document.name}</span>
                  </div>
                ))}
                {employeeData.documents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
