"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ReservationListPage() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      setReservations(json?.reservations || []);
      setError("");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const deleteReservation = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the reservation for "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/reservations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      
      setReservations(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      alert(e?.message || "Failed to delete reservation");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-light text-slate-800 mb-3">Reservations</h1>
          <p className="text-slate-600 text-lg">Manage your reservation records</p>
        </div>
        
        <div className="mb-8 flex items-center justify-center">
          <Link
            href="/add-reservation"
            className="inline-flex items-center px-8 py-3 text-sm font-medium text-white bg-slate-800 rounded-full hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            + Add Reservation
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-600">
              <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
              Loading reservations...
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <div className="text-red-500 mb-4">⚠️ Error loading reservations</div>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={fetchReservations}
                className="px-6 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : reservations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-slate-400 mb-4 text-6xl">📋</div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No reservations yet</h3>
              <p className="text-slate-500 mb-6">Create your first reservation to get started</p>
              <Link
                href="/add-reservation"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-slate-800 rounded-full hover:bg-slate-900 transition-all duration-200"
              >
                + Create Reservation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">Reservation No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">Files</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 tracking-wide">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                        {r.reservation_no || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {r.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.contact_no || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {r.image_url && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              📷 Image
                            </span>
                          )}
                          {r.video_url && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                              🎥 Video
                            </span>
                          )}
                          {!r.image_url && !r.video_url && (
                            <span className="text-slate-400 text-xs">No files</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteReservation(r._id, r.name)}
                          disabled={deleting === r._id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {deleting === r._id ? (
                            <>
                              <div className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              🗑️ Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

