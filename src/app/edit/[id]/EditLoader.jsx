"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import LocationSelector from "@/components/location";

export default function EditLoader({ id }) {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ reservationNo: "", name: "", phone: "", channel: "all", comments: "" });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [persistedImageUrl, setPersistedImageUrl] = useState(null);
  const [persistedVideoUrl, setPersistedVideoUrl] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [locationStr, setLocationStr] = useState("");

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

  useEffect(() => {
    if (!reservation) return;
    setForm({
      reservationNo: reservation?.reservation_no || "",
      name: reservation?.name || "",
      phone: reservation?.contact_no || "",
      channel: "all",
      comments: reservation?.comments || "",
    });
    setPersistedImageUrl(reservation?.image_url || null);
    setPersistedVideoUrl(reservation?.video_url || null);
    const loc = reservation?.location;
    if (!loc) setLocationStr("");
    else if (typeof loc === "string") setLocationStr(loc);
    else {
      try { setLocationStr(JSON.stringify(loc)); } catch { setLocationStr(""); }
    }
  }, [reservation]);

  useEffect(() => {
    if (!image) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!video) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(video);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    setImage(e.target.files?.[0] || null);
  }

  function handleVideoChange(e) {
    setVideo(e.target.files?.[0] || null);
  }

  function removeImage() {
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setImageInputKey((k) => k + 1);
  }

  function removeVideo() {
    setVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    setVideoInputKey((k) => k + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("reservation_no", form.reservationNo || "");
      fd.append("name", form.name || "");
      fd.append("contact_no", form.phone || "");
      fd.append("comments", form.comments || "");
      fd.append("allChannel", String(form.channel === "all"));
      fd.append("sms", String(form.channel === "sms"));
      fd.append("whatsapp", String(form.channel === "whatsapp"));
      fd.append("location", locationStr || "");
      if (image) fd.append("image", image);
      if (video) fd.append("video", video);

      const res = await axios.put(`/api/reservations/${reservation._id}`, fd);
      const data = res?.data || {};

      setMessage("Reservation updated successfully.");
      setForm((prev) => ({
        ...prev,
        reservationNo: data?.reservation?.reservation_no || prev.reservationNo,
        name: data?.reservation?.name || prev.name,
        phone: data?.reservation?.contact_no || prev.phone,
        comments: data?.reservation?.comments || prev.comments,
      }));
      if (data?.reservation?.image_url) setPersistedImageUrl(data.reservation.image_url);
      if (data?.reservation?.video_url) setPersistedVideoUrl(data.reservation.video_url);
      if (Object.prototype.hasOwnProperty.call(data?.reservation || {}, "location")) {
        setLocationStr(data.reservation.location || "");
      }
      setImage(null);
      setVideo(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setImageInputKey((k) => k + 1);
      setVideoInputKey((k) => k + 1);
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Update failed";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

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

  const currentImageSrc = previewUrl || persistedImageUrl || null;
  const currentVideoSrc = videoPreviewUrl || persistedVideoUrl || null;
  const isCurrentImagePdf = !previewUrl && typeof currentImageSrc === "string" && currentImageSrc.toLowerCase().includes(".pdf");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-light text-slate-800 mb-3">Edit Reservation</h1>
          <p className="text-slate-600 text-lg">Update the reservation details</p>
        </div>

        <div className="mb-8 flex items-center justify-center">
          <Link
            href="/reservation-list"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            ← View Reservations
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <label htmlFor="reservationNo" className="text-sm font-semibold text-slate-700 tracking-wide">Reservation No.</label>
              <input
                id="reservationNo"
                name="reservationNo"
                type="text"
                placeholder="Enter Reservation Number"
                value={form.reservationNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 tracking-wide">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter Name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700 tracking-wide">Contact Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter Contact Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
              <p className="text-xs text-slate-500">Country code optional for now.</p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">Location (Start/End)</label>
              <LocationSelector value={locationStr} onChange={setLocationStr} />
            </div>

            <div className="space-y-3">
              <label htmlFor="image" className="text-sm font-semibold text-slate-700 tracking-wide">File (image)</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={imageInputRef}
                key={imageInputKey}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
              {currentImageSrc && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 relative">
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl z-10"
                      title="Remove image"
                    >
                      ×
                    </button>
                  )}
                  {isCurrentImagePdf ? (
                    <iframe src={currentImageSrc} className="h-64 w-full rounded-lg shadow-sm" title="PDF preview" />
                  ) : (
                    <img src={currentImageSrc} alt="preview" className="h-48 w-auto object-contain mx-auto rounded-lg shadow-sm" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="video" className="text-sm font-semibold text-slate-700 tracking-wide">File (video)</label>
              <input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                ref={videoInputRef}
                key={videoInputKey}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
              {currentVideoSrc && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 relative">
                  {videoPreviewUrl && (
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 w-8 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl z-10"
                      title="Remove video"
                    >
                      ×
                    </button>
                  )}
                  <video src={currentVideoSrc} controls className="h-48 w-auto mx-auto rounded-lg shadow-sm" />
                </div>
              )}
            </div>

            <div className="space-y-3 md:col-span-2">
              <label htmlFor="comments" className="text-sm font-semibold text-slate-700 tracking-wide">Comments</label>
              <textarea
                id="comments"
                name="comments"
                rows={6}
                placeholder="Enter any additional comments..."
                value={form.comments}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {message && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/reservation-list"
              className="px-8 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 text-sm font-medium text-white bg-slate-800 rounded-full hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
