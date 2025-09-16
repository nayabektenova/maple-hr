"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Upload } from "lucide-react"

export function AddEmployeeForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    gender: "",
    personalEmail: "",
    phoneNumber: "",
    passportNumber: "",
    dateOfBirth: "",
    nationality: "",
    materialStatus: "",
    emergencyContact: "",
    emergencyContact2: "",
    position: "",
    department: "",
    manager: "",
    joiningDate: "",
    currentContract: "",
    workEmail: "",
    workPhone: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Details (full width) */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  <span className="text-red-500">*</span> First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passportNumber" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Passport Number
                </Label>
                <Input
                  id="passportNumber"
                  value={formData.passportNumber}
                  onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Date of birth
                </Label>
                <div className="relative">
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Employee ID
                </Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange("employeeId", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-sm font-medium">
                  Nationality
                </Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) => handleInputChange("nationality", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialStatus" className="text-sm font-medium">
                  Material status
                </Label>
                <Input
                  id="materialStatus"
                  value={formData.materialStatus}
                  onChange={(e) => handleInputChange("materialStatus", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="personalEmail" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Personal Email
                </Label>
                <Input
                  id="personalEmail"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Emergency contact
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Phone number
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact2" className="text-sm font-medium">
                  <span className="text-red-500">*</span> Emergency contact
                </Label>
                <Input
                  id="emergencyContact2"
                  value={formData.emergencyContact2}
                  onChange={(e) => handleInputChange("emergencyContact2", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Work (left) + Upload (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Work Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    <span className="text-red-500">*</span> Position
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    <span className="text-red-500">*</span> Department
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-sm font-medium">
                    <span className="text-red-500">*</span> Manager
                  </Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange("manager", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate" className="text-sm font-medium">
                    Joining Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                      className="w-full"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentContract" className="text-sm font-medium">
                    <span className="text-red-500">*</span> Current Contract
                  </Label>
                  <Input
                    id="currentContract"
                    value={formData.currentContract}
                    onChange={(e) => handleInputChange("currentContract", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEmail" className="text-sm font-medium">
                    <span className="text-red-500">*</span> Work Email
                  </Label>
                  <Input
                    id="workEmail"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => handleInputChange("workEmail", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="workPhone" className="text-sm font-medium">
                    Work Phone
                  </Label>
                  <Input
                    id="workPhone"
                    value={formData.workPhone}
                    onChange={(e) => handleInputChange("workPhone", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Upload file(s)</p>
                  <p className="text-sm text-gray-500">Drag and Drop file(s) here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" className="bg-green-600 hover:bg-green-700 px-8">
          Save Employee
        </Button>
      </div>
    </form>
  )
}
