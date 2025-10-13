import Requests from "@/components/requests";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Requests />
      </div>
    </div>
  );
}
