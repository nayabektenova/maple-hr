"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Loader, Trash2 } from "lucide-react";

type JobPosition = {
  position_id: number;
  position_name: string;
  company_name: string;
  team_department: string;
  employment_type: string;
  published_at: string;
};
//  position id :number 
export default function ResumeAtsPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("job_positions")
          .select("*")
          .order("published_at", { ascending: false });

        if (fetchError) throw new Error(fetchError.message);

        setPositions((data as JobPosition[]) || []);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleDeletePosition = async (positionId: number) => {
    if (!confirm("Delete this position and all candidates?")) return;
    // delete position from the supabase database
    try {
      const { error: deleteError } = await supabase
        .from("job_positions")
        .delete()
        .eq("position_id", positionId); // position id: number 

      if (deleteError) throw new Error(deleteError.message);

      setPositions(positions.filter((p) => p.position_id !== positionId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader size={20} className="animate-spin" />
          Loading positions...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Resume ATS</h1>
            <p className="text-gray-600 mt-2">Manage job positions and evaluate candidates</p>
          </div>
          <Link
            href="/resume-ats/post-job"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium"
          >
            <Plus size={18} /> Post New Position
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {/* Positions Grid */}
        {positions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No job positions yet</p>
            <Link
              href="/resume-ats/post-job"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium"
            >
              Create Your Company First Position
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((pos) => (
              <div
                key={pos.position_id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {pos.position_name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">{pos.company_name}</p>
                <p className="text-sm text-gray-600 mb-4">
                  {pos.team_department} • {pos.employment_type}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/resume-ats/${pos.position_id}/evaluate-candidates`}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium text-center"
                  >
                    View & Evaluate
                  </Link>
                  <button
                    onClick={() => handleDeletePosition(pos.position_id)}
                    className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}