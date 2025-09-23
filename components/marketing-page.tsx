"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MarketingPage() {
  const router = useRouter();

  const industries = [
    { name: "Technology", image: "/technology.jpg" },
    { name: "Healthcare", image: "/healthcare.jpeg" },
    { name: "Education", image: "/education.jpg" },
    { name: "Finance", image: "/finance.jpg" },
    { name: "Retail", image: "/retail.jpeg" },
    { name: "Construction", image: "/construction.jpg" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-gray-800">
      <section className="text-center py-16 px-6">
        <h1 className="text-5xl font-extrabold text-green-700 mb-4">
          Welcome to Maple HR
        </h1>
        <p className="text-xl max-w-3xl mx-auto">
          Empowering Canadian businesses with a modern HR Management System —
          streamlined, centralized, and designed for growth.
        </p>
      </section>

      {/* NEW SECTION: Industries */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-700 text-center mb-10">
          MapleHR is here for
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {industries.map((industry, idx) => (
            <div
              key={idx}
              onClick={() => router.push("/login")}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between items-center hover:scale-105 transition-transform cursor-pointer"
            >
              <h3 className="text-xl font-bold text-green-700 mb-4">
                {industry.name}
              </h3>

              {/* Image container */}
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src={industry.image}
                  alt={industry.name}
                  width={300}
                  height={300}
                  className="object-contain max-h-full"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXISTING MAIN MAPLE HR SECTIONS */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:scale-105 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            What is Maple HR?
          </h2>
          <p className="text-lg leading-relaxed">
            Canadian-based HR Management System, a web platform designed to
            streamline, centralize, and automate essential HR functions for
            small to mid-sized organizations. The system provides secure,
            scalable, and user-friendly solutions to support both administrative
            workflows and employee self-service needs.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:scale-105 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            The Problem
          </h2>
          <p className="text-lg leading-relaxed">
            Small and mid-sized Canadian organizations face significant
            challenges in managing HR tasks due to reliance on fragmented
            systems like spreadsheets, paper forms, and disconnected
            applications. This leads to inefficiencies, payroll mistakes, and
            difficulties during audits. HR teams spend too much time on manual
            data correction instead of focusing on strategic initiatives.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:scale-105 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            What Problems Are We Solving?
          </h2>
          <p className="text-lg leading-relaxed">
            Our HR Management System consolidates all HR functions into one
            platform. From employee records to payroll, scheduling, leave
            management, and compliance — everything is in one place. With
            centralized data, managers gain real-time insights into headcount,
            turnover, and leave balances for faster decision-making. Security is
            enhanced with controlled access while empowering employees with
            self-service tools.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-green-700 mb-6">
          Looks Interesting?
        </h2>
        <button
          onClick={() => router.push("/login")}
          className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
        >
          Try Free
        </button>
        <p className="mt-8 text-lg">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-green-600 underline font-semibold hover:text-green-800"
          >
            Login
          </button>
        </p>
      </section>
    </div>
  );
}
