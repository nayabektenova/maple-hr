"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoginPageComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login with:", { username, password });
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
              placeholder="Enter your username"
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
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Create account
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
