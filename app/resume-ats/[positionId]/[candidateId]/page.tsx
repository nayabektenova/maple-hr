"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Loader, CheckCircle } from "lucide-react";

type CandidateProfile = {
  candidate_id: string;
  position_id: number;
  position_name: string;
  candidate_fullname: string;
  candidate_email: string | null;
  candidate_contact: string | null;
  candidate_resume_content: string;
  match_score: number;
  review_status: string;
  final_decision: string | null;
  submitted_at: string;
};

export default function CandidateViewPage() {
  const params = useParams();
  const router = useRouter();
  const positionId = params?.positionId as string;
  const candidateId = params?.candidateId as string;

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("candidate_id", candidateId)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        if (!data) throw new Error("Candidate not found");

        setCandidate(data as CandidateProfile);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const handleFinalDecision = async (decision: "Approved" | "Rejected" | "On-Hold") => {
    if (!candidate) return;

    setDeciding(true);
    try {
      const { error: updateError } = await supabase
        .from("candidate_profiles")
        .update({
          final_decision: decision,
          review_status: "Reviewed",
        })
        .eq("candidate_id", candidateId);

      if (updateError) throw new Error(updateError.message);

      setCandidate({ ...candidate, final_decision: decision, review_status: "Reviewed" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader size={20} className="animate-spin" />
          Loading candidate...
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-red-200 p-6 text-red-700">
          Error: {error}
          <Link
            href={`/resume-ats/${positionId}/evaluate-candidates`}
            className="block mt-4 text-emerald-600 hover:underline"
          >
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link
          href={`/resume-ats/${positionId}/evaluate-candidates`}
          className="inline-flex items-center gap-2 text-gray-700 hover:underline mb-6"
        >
          <ArrowLeft size={18} /> Back to Candidates
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {candidate.candidate_fullname}
          </h1>
          <p className="text-gray-600 mb-6">Position: {candidate.position_name}</p>

          {/* Candidate Info */}
          <div className="grid grid-cols-3 gap-4 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-medium">{candidate.candidate_email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="font-medium">{candidate.candidate_contact || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Match Score</p>
              <p
                className={`text-2xl font-bold ${
                  candidate.match_score >= 75
                    ? "text-emerald-600"
                    : candidate.match_score >= 50
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {candidate.match_score}%
              </p>
            </div>
          </div>

          {/* Resume */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resume Content</h2>
            <div className="bg-gray-50 p-6 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200">
              {candidate.candidate_resume_content}
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="mt-8 pt-6 border-t">
            {candidate.final_decision ? (
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={24}
                  className={
                    candidate.final_decision === "Approved"
                      ? "text-emerald-600"
                      : candidate.final_decision === "On-Hold"
                      ? "text-amber-600"
                      : "text-red-600"
                  }
                />
                <div>
                  <p className="text-sm text-gray-600">Decision Made</p>
                  <p className="text-lg font-bold text-gray-900">
                    {candidate.final_decision}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">Make a Final Decision:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFinalDecision("Approved")}
                    disabled={deciding}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                  >
                    {deciding ? "Updating..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleFinalDecision("On-Hold")}
                    disabled={deciding}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                  >
                    {deciding ? "Updating..." : "⏸ On-Hold"}
                  </button>
                  <button
                    onClick={() => handleFinalDecision("Rejected")}
                    disabled={deciding}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                  >
                    {deciding ? "Updating..." : "✕ Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}