"use client";

import Image from "next/image";
import { useState } from "react";

export default function RegisterPageComponent() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register with:", {
      email,
      firstName,
      lastName,
      role,
      username,
      password,
      confirmPassword,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {/* Background */}
      {/* i dont know why my background image is not showing up */}
      {/* i will fix this later */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/login-background.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        {/* this is fo the logo and title  */}
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

        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
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

          <div>
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

          <div>
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

          <div>
            <label className="block text-gray-700 text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
              required
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div>
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

          <div>
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

          <div>
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

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Create Your Account
          </button>
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
