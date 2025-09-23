// app/login/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState(""); // changed to email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // success
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      alert(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      <div className="absolute inset-0 -z-10">
        <Image src="/login-background.png" alt="Background" fill className="object-cover" priority />
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Image src="/logo.png" alt="MapleHR Logo" width={40} height={40} className="mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">MapleHR</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black" placeholder="Enter your email" required />
          </div>

          <div>
            <label className="block text-gray-700 text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black" placeholder="Enter your password" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Trying for the first time?{" "}
          <Link href="/register" className="text-green-600 hover:underline">Register here</Link>
        </p>

        <p className="text-xs text-gray-500 text-center mt-6">
          By creating an account you agree to our{" "}
          <a href="#" className="text-green-600 hover:underline">Terms and Conditions</a> and{" "}
          <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
