"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EditForm from "./EditForm";

export default function EditLoader({ id }) {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/reservations/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
        if (active) setReservation(json?.reservation || null);
      } catch (e) {
        if (active) setError(e?.message || "Failed to load reservation");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white grid place-items-center p-6 text-slate-700">Loading...</div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">{error || "Reservation not found."}</p>
        <Link href="/reservation-list" className="text-slate-700 underline">Back to list</Link>
      </div>
    );
  }

  return <EditForm reservation={reservation} />;
}
