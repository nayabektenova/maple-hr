"use client";

import Image from "next/image";
import { useState } from "react";

export default function RegisterPageComponent() {
  // Personal details
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Business details
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessProvince, setBusinessProvince] = useState("");
  const [businessPostalCode, setBusinessPostalCode] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [taxId, setTaxId] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side password match check
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Collect everything and do whatever (here: console)
    console.log("Register with:", {
      email,
      firstName,
      lastName,
      username,
      password,
      confirmPassword,
      businessName,
      businessAddress,
      businessCity,
      businessProvince,
      businessPostalCode,
      businessPhone,
      businessWebsite,
      industry,
      numberOfEmployees,
      taxId,
    });

    // TODO: Replace with real registration logic (API call)
    alert("Registration submitted (check console).");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative py-8">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/login-background.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl">
        {/* Logo & title */}
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/logo.png"
            alt="MapleHR Logo"
            width={40}
            height={40}
            className="mr-2"
          />
          <h1 className="text-2xl font-bold text-gray-800">MapleHR</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Two-column layout: personal | business */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Personal Details
              </h2>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Set your username"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Set your password"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Your Business Details
              </h2>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Enter business name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm mb-1">City</label>
                  <input
                    type="text"
                    value={businessCity}
                    onChange={(e) => setBusinessCity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                    placeholder="City"
                    required
                  />
                </div>

                <div className="w-1/3">
                  <label className="block text-gray-700 text-sm mb-1">Province</label>
                  <input
                    type="text"
                    value={businessProvince}
                    onChange={(e) => setBusinessProvince(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                    placeholder="Province"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Postal Code</label>
                <input
                  type="text"
                  value={businessPostalCode}
                  onChange={(e) => setBusinessPostalCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Postal code"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Phone</label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Business phone"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Website</label>
                <input
                  type="url"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="https://example.com"
                />
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  required
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Number of Employees</label>
                <select
                  value={numberOfEmployees}
                  onChange={(e) => setNumberOfEmployees(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  required
                >
                  <option value="">Select</option>
                  <option value="1-5">1-5</option>
                  <option value="6-20">6-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-200">51-200</option>
                  <option value="200+">200+</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-1">Tax ID / Business Registration No.</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="Tax ID or registration number"
                />
              </div>
            </div>
          </div>

          {/* Create account button spans full width under both sections */}
          <div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Create Your Account
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          By creating an account you agree to our{" "}
          <a href="#" className="text-green-600 hover:underline">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="#" className="text-green-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
