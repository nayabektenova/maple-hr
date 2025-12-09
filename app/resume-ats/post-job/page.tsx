"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Loader, CheckCircle } from "lucide-react";

type JobFormData = {
  position_name: string;
  company_name: string;
  team_department: string;
  employment_type: string;
  job_description: string;
  required_skills: string;
  job_links: string;
};

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    position_name: "",
    company_name: "",
    team_department: "",
    employment_type: "",
    job_description: "",
    required_skills: "",
    job_links: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (
      !formData.position_name ||
      !formData.company_name ||
      !formData.team_department ||
      !formData.employment_type ||
      !formData.job_description ||
      !formData.required_skills
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      // Insert job position
      const { data, error: insertError } = await supabase
        .from("job_positions")
        .insert([
          {
            position_name: formData.position_name,
            company_name: formData.company_name,
            team_department: formData.team_department,
            employment_type: formData.employment_type,
            job_description: formData.job_description,
            required_skills: formData.required_skills,
            job_links: formData.job_links || null,
          },
        ])
        .select("position_id")
        .single();

      if (insertError) {
        setError(`Failed to post job: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Success - reset form
      setSuccess(true);
      setTimeout(() => {
        router.push(`/resume-ats/${data.position_id}/evaluate-candidates`);
      }, 1500);
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/resume-ats"
            className="inline-flex items-center gap-2 text-gray-700 hover:underline mb-4"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Post New Position</h1>
          <p className="text-gray-600 mt-2">
            Create a new job position and begin evaluating candidates
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle size={18} />
              Position posted successfully! Redirecting to evaluation...
            </div>
          )}

          <div className="space-y-6">
            {/* Grid: Position Name, Company, Department, Employment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position Name *
                </label>
                <input
                  type="text"
                  name="position_name"
                  value={formData.position_name}
                  onChange={handleChange}
                  placeholder="e.g., Senior React Developer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., TechVision Inc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Team / Department *
                </label>
                <input
                  type="text"
                  name="team_department"
                  value={formData.team_department}
                  onChange={handleChange}
                  placeholder="e.g., Product Engineering"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employment Type *
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  disabled={loading}
                >
                  <option value="">Select employment type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job Description *
              </label>
              <textarea
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                placeholder="Detailed job description, responsibilities, expectations, and benefits..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                disabled={loading}
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Required Skills & Qualifications *
              </label>
              <textarea
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                placeholder="List all required skills, education, experience, certifications, and qualifications..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                disabled={loading}
              />
            </div>

            {/* Job Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job Links (Optional)
              </label>
              <input
                type="url"
                name="job_links"
                value={formData.job_links}
                onChange={handleChange}
                placeholder="https://example.com/careers/position"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Posting Position...
                </>
              ) : (
                "Post Position & Start Evaluating"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}