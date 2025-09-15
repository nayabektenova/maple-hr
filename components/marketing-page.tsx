"use client";

import { useRouter } from "next/navigation";

export default function MarketingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-gray-800">
      {/* Welcome Section */}
      <section className="text-center py-20 px-6 bg-green-600 text-white">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to Maple HR</h1>
        <p className="text-xl max-w-3xl mx-auto">
          Empowering Canadian businesses with a modern HR Management System —
          streamlined, centralized, and designed for growth.
        </p>
      </section>

      {/* What is Maple HR */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-green-700 mb-4">What is Maple HR?</h2>
        <p className="text-lg leading-relaxed">
          Canadian-based HR Management System, a web platform designed to
          streamline, centralize, and automate essential HR functions for small to
          mid-sized organizations. The system provides secure, scalable, and
          user-friendly solutions to support both administrative workflows and
          employee self-service needs.
        </p>
      </section>

      {/* Problem Statement */}
      <section className="py-16 px-6 max-w-5xl mx-auto bg-green-50 rounded-2xl shadow-md">
        <h2 className="text-3xl font-bold text-green-700 mb-4">The Problem</h2>
        <p className="text-lg leading-relaxed">
          Small and mid-sized Canadian organizations face significant challenges
          in managing HR tasks due to reliance on fragmented systems like
          spreadsheets, paper forms, and disconnected applications. This leads to
          inefficiencies, payroll mistakes, and difficulties during audits. HR teams
          spend too much time on manual data correction instead of focusing on
          strategic initiatives.
        </p>
      </section>

      {/* Our Solution */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-green-700 mb-4">
          What Problems Are We Solving?
        </h2>
        <p className="text-lg leading-relaxed">
          Our HR Management System consolidates all HR functions into one platform.
          From employee records to payroll, scheduling, leave management, and
          compliance — everything is in one place. With centralized data,
          managers gain real-time insights into headcount, turnover, and leave
          balances for faster decision-making. Security is enhanced with
          controlled access while empowering employees with self-service tools.
        </p>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center bg-green-600 text-white">
        <h2 className="text-3xl font-bold mb-6">Looks Interesting?</h2>
        <button
          onClick={() => router.push("/login")}
          className="px-8 py-4 bg-white text-green-700 font-semibold rounded-lg shadow-md hover:bg-green-100 transition"
        >
          Try Free
        </button>
        <p className="mt-8 text-lg">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="underline font-semibold hover:text-gray-200"
          >
            Login
          </button>
        </p>
      </section>
    </div>
  );
}
