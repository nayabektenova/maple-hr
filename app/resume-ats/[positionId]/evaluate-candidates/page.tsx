"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Upload,
  Eye,
  Trash2,
  CheckCircle,
  X,
  Loader,
} from "lucide-react";

type JobPosition = {
  position_id: number;
  position_name: string;
  company_name: string;
  team_department: string;
  employment_type: string;
  job_description: string;
  required_skills: string;
  job_links: string | null;
  published_at: string;
};

type CandidateProfile = {
  candidate_id: string;
  position_id: number;
  position_name: string;
  candidate_fullname: string;
  candidate_email: string | null;
  candidate_contact: string | null;
  candidate_resume_content: string;
  match_score: number;
  review_status: "Pending" | "Reviewed";
  final_decision: string | null;
  submitted_at: string;
};

export default function EvaluateCandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const positionId = params?.positionId as string;

  // States
  const [position, setPosition] = useState<JobPosition | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resume upload states
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [resumeContent, setResumeContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmailInput, setCandidateEmailInput] = useState("");
  const [candidatePhoneInput, setCandidatePhoneInput] = useState("");

  // View modal
  const [viewingCandidate, setViewingCandidate] = useState<CandidateProfile | null>(null);
  const [showPositionDetails, setShowPositionDetails] = useState(false);

  // Fetch position and candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job position
        const { data: posData, error: posError } = await supabase
          .from("job_positions")
          .select("*")
          .eq("position_id", positionId)
          .single();

        if (posError) throw new Error(posError.message);
        if (!posData) throw new Error("Position not found");

        setPosition(posData as JobPosition);

        // Fetch candidates for this position
        const { data: candData, error: candError } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("position_id", positionId)
          .order("match_score", { ascending: false });

        if (candError) throw new Error(candError.message);

        setCandidates((candData as CandidateProfile[]) || []);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [positionId]);

  // Calculate match score using keyword matching
  const calculateMatchScore = (resumeText: string, jobDesc: string): number => {
    const resumeWords = resumeText.toLowerCase().split(/\s+/);
    const jobWords = jobDesc.toLowerCase().split(/\s+/);
    const matches = resumeWords.filter((w) => jobWords.includes(w)).length;
    const score = Math.min(
      100,
      Math.round((matches / Math.max(resumeWords.length, jobWords.length)) * 100) +
        35
    );
    return score;
  };

  // Handle file upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setResumeContent(text);
    } catch (err) {
      setError("Failed to read resume file");
    }
  };

  // Submit candidate for evaluation
  const handleSubmitCandidate = async () => {
    if (!resumeContent || !candidateName || !position) {
      setError("Please fill in all required fields and upload a resume");
      return;
    }

    setUploading(true);
    try {
      // Calculate match score
      const jobFullText = `${position.position_name} ${position.job_description} ${position.required_skills}`;
      const matchScore = calculateMatchScore(resumeContent, jobFullText);

      // Insert candidate
      const { data, error: insertError } = await supabase
        .from("candidate_profiles")
        .insert([
          {
            position_id: parseInt(positionId),
            position_name: position.position_name,
            candidate_fullname: candidateName,
            candidate_email: candidateEmailInput || null,
            candidate_contact: candidatePhoneInput || null,
            candidate_resume_content: resumeContent,
            match_score: matchScore,
            review_status: "Pending",
            final_decision: null,
          },
        ])
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      // Update UI
      setCandidates([data as CandidateProfile, ...candidates]);

      // Reset form
      setResumeContent("");
      setCandidateName("");
      setCandidateEmailInput("");
      setCandidatePhoneInput("");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Remove this candidate from evaluation?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("candidate_profiles")
        .delete()
        .eq("candidate_id", candidateId);

      if (deleteError) throw new Error(deleteError.message);

      setCandidates(candidates.filter((c) => c.candidate_id !== candidateId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Update final decision
  const handleFinalDecision = async (
    candidateId: string,
    decision: "Approved" | "Rejected" | "On-Hold"
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("candidate_profiles")
        .update({ 
          final_decision: decision,
          review_status: "Reviewed"
        })
        .eq("candidate_id", candidateId);

      if (updateError) throw new Error(updateError.message);

      setCandidates(
        candidates.map((c) =>
          c.candidate_id === candidateId 
            ? { ...c, final_decision: decision, review_status: "Reviewed" } 
            : c
        )
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Delete position
  const handleDeletePosition = async () => {
    if (!confirm("Delete this position and all candidates?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("job_positions")
        .delete()
        .eq("position_id", positionId);

      if (deleteError) throw new Error(deleteError.message);

      router.push("/resume-ats");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader size={20} className="animate-spin" />
          Loading position...
        </div>
      </div>
    );
  }

  if (error && !position) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg border border-red-200 p-6 text-red-700">
          Error: {error}
          <Link
            href="/resume-ats"
            className="block mt-4 text-emerald-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/resume-ats"
            className="inline-flex items-center gap-2 text-gray-700 hover:underline mb-4"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {position?.position_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {position?.company_name} • {position?.team_department} • {candidates.length}{" "}
                candidates
              </p>
            </div>
            <button
              onClick={handleDeletePosition}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 text-sm font-medium"
            >
              <Trash2 size={16} /> Delete Position
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Candidates Table */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-medium text-gray-900">Candidates Under Review</h2>
              <button
                onClick={() => setShowPositionDetails(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Eye size={16} /> View Position
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm">No candidates yet. Submit a resume to begin evaluation!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-600">
                        Match Score
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-600">
                        Candidate Name
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-600">
                        Email
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-600 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((cand) => (
                      <tr key={cand.candidate_id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <span
                            className={`font-bold text-lg ${
                              cand.match_score >= 75
                                ? "text-emerald-600"
                                : cand.match_score >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {cand.match_score}%
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {cand.candidate_fullname}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {cand.candidate_email || "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${
                              cand.review_status === "Reviewed"
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-blue-700 bg-blue-50 border-blue-200"
                            }`}
                          >
                            {cand.review_status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/resume-ats/${positionId}/${cand.candidate_id}`}
                              className="text-emerald-600 hover:underline text-sm font-medium"
                            >
                              View Resume
                            </Link>
                            <button
                              onClick={() => handleDeleteCandidate(cand.candidate_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar - Resume Upload */}
          <div className="bg-white rounded-lg border border-gray-200 h-fit sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-medium text-gray-900">Submit Candidate</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    activeTab === "upload"
                      ? "border-b-2 border-emerald-600 text-emerald-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    activeTab === "manual"
                      ? "border-b-2 border-emerald-600 text-emerald-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Paste
                </button>
              </div>

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div>
                  <label className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={24} />
                      <p className="text-gray-700 font-medium text-sm">
                        Upload Resume
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, or TXT
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Manual Tab */}
              {activeTab === "manual" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Resume Content
                  </label>
                  <textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Paste resume content here..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              )}

              {/* Candidate Info */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={candidateEmailInput}
                  onChange={(e) => setCandidateEmailInput(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={candidatePhoneInput}
                  onChange={(e) => setCandidatePhoneInput(e.target.value)}
                  placeholder="+1-555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitCandidate}
                disabled={uploading || !resumeContent || !candidateName}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-md transition text-sm flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Submit & Evaluate"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Details Modal */}
      {showPositionDetails && position && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{position.position_name}</h2>
              <button
                onClick={() => setShowPositionDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-600">Company</p>
                  <p className="font-medium">{position.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Team / Department</p>
                  <p className="font-medium">{position.team_department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Employment Type</p>
                  <p className="font-medium">{position.employment_type}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Job Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {position.job_description}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Required Skills & Qualifications</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {position.required_skills}
                </p>
              </div>

              {position.job_links && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Job Links</h3>
                  <a
                    href={position.job_links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-sm"
                  >
                    {position.job_links}
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPositionDetails(false)}
                className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-md font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}