"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import dynamic from "next/dynamic";
import LocationSelector from "@/components/location";

const Webcam = dynamic(() => import("react-webcam"), { ssr: false });

export default function AddReservationPage() {
  const [form, setForm] = useState({
    reservationNo: "",
    name: "",
    phone: "",
    channel: "all",
    comments: "",
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [showCamera, setShowCamera] = useState(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [capturing, setCapturing] = useState(false);
  const [locationStr, setLocationStr] = useState("");

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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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

  function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  function closeCamera() {
    try {
      if (capturing && mediaRecorderRef.current) mediaRecorderRef.current.stop();
      const stream = webcamRef.current?.stream || webcamRef.current?.video?.srcObject;
      stream?.getTracks()?.forEach((t) => t.stop());
    } catch (_) {}
    setCapturing(false);
    setShowCamera(null);
  }

  function capturePhoto() {
    const imgSrc = webcamRef.current?.getScreenshot({ width: 1280, height: 720 });
    if (!imgSrc) return;
    const file = dataURLtoFile(imgSrc, "webcam-photo.jpg");
    setImage(file);
    setShowCamera(null);
  }

  function startRecording() {
    const stream = webcamRef.current?.stream || webcamRef.current?.video?.srcObject;
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], "webcam-video.webm", { type: "video/webm" });
      setVideo(file);
      setCapturing(false);
      setShowCamera(null);
      chunksRef.current = [];
    };
    mr.start();
    setCapturing(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("reservation_no", form.reservationNo || "");
      formData.append("name", form.name);
      formData.append("contact_no", form.phone || "");
      formData.append("comments", form.comments || "");
      formData.append("allChannel", String(form.channel === "all"));
      formData.append("sms", String(form.channel === "sms"));
      formData.append("whatsapp", String(form.channel === "whatsapp"));
      formData.append("location", locationStr || "");
      
      if (image) {
        formData.append("image", image);
      }
      if (video) {
        formData.append("video", video);
      }

      const res = await axios.post("/api/reservations", formData);
      const data = res?.data || {};
      
      setMessage(
        data?.imageStatus 
          ? `Reservation saved. ${data.imageStatus}.` 
          : "Reservation saved successfully. 🎉"
      );
      
      setForm({ reservationNo: "", name: "", phone: "", channel: "all", comments: "" });
      setImage(null);
      setVideo(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setImageInputKey((k) => k + 1);
      setVideoInputKey((k) => k + 1);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 
        error.message || 
        "Reservation Saving Problem";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-light text-slate-800 mb-3">Create Reservation</h1>
          <p className="text-slate-600 text-lg">Add a new reservation with ease</p>
        </div>
        
        <div className="mb-8 flex items-center justify-center">
          <Link
            href="/reservation-list"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            ← View Reservations
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Reservation Number */}
            <div className="space-y-3">
              <label htmlFor="reservationNo" className="text-sm font-semibold text-slate-700 tracking-wide">
                Reservation No.
              </label>
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

            {/* Name */}
            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 tracking-wide">
                Name
              </label>
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

            {/* Contact Number */}
            <div className="space-y-3 md:col-span-2">
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700 tracking-wide">
                Contact Number
              </label>
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

            {/* Communication Channel */}
            <div className="space-y-4 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700 tracking-wide">Communication Channel</span>
              <div className="flex gap-6">
                {["all", "sms", "whatsapp"].map((ch) => (
                  <label key={ch} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
                    <input
                      type="radio"
                      name="channel"
                      value={ch}
                      checked={form.channel === ch}
                      onChange={handleChange}
                      className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-slate-200 focus:ring-2"
                    />
                    <span className="group-hover:text-slate-900 transition-colors">
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">Location (Start/End)</label>
              <LocationSelector value={locationStr} onChange={setLocationStr} />
            </div>

            {/* File Upload (image) */}
            <div className="space-y-3">
              <label htmlFor="image" className="text-sm font-semibold text-slate-700 tracking-wide">
                File (image)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={imageInputRef}
                key={imageInputKey}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCamera(showCamera === "photo" ? null : "photo")}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Use webcam (photo)
                </button>
              </div>
              {previewUrl && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 relative">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl z-10"
                    title="Remove image"
                  >
                    ×
                  </button>
                  {image?.type?.startsWith("image/") ? (
                    <img src={previewUrl} alt="preview" className="h-48 w-auto object-contain mx-auto rounded-lg shadow-sm" />
                  ) : image?.type?.startsWith("video/") ? (
                    <video src={previewUrl} controls className="h-48 w-auto mx-auto rounded-lg shadow-sm" />
                  ) : image?.type === "application/pdf" ? (
                    <iframe src={previewUrl} className="h-64 w-full rounded-lg shadow-sm" title="PDF preview" />
                  ) : (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800 underline transition-colors">
                      Preview file
                    </a>
                  )}
                </div>
              )}
              {showCamera === "photo" && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full rounded-lg" />
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={capturePhoto} className="px-4 py-2 text-sm text-white bg-slate-800 rounded-lg hover:bg-slate-900">Capture</button>
                    <button type="button" onClick={closeCamera} className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload (video) */}
            <div className="space-y-3">
              <label htmlFor="video" className="text-sm font-semibold text-slate-700 tracking-wide">
                File (video)
              </label>
              <input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                ref={videoInputRef}
                key={videoInputKey}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-50 file:px-4 file:py-2 file:text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-200"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCamera(showCamera === "video" ? null : "video")}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Use webcam (video)
                </button>
              </div>
              {videoPreviewUrl && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 relative">
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 w-8 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl z-10"
                    title="Remove video"
                  >
                    ×
                  </button>
                  {video?.type?.startsWith("video/") ? (
                    <video src={videoPreviewUrl} controls className="h-48 w-auto mx-auto rounded-lg shadow-sm" />
                  ) : (
                    <a href={videoPreviewUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800 underline transition-colors">
                      Preview file
                    </a>
                  )}
                </div>
              )}
              {showCamera === "video" && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <Webcam ref={webcamRef} audio className="w-full rounded-lg" />
                  <div className="mt-3 flex gap-3">
                    {capturing ? (
                      <button type="button" onClick={stopRecording} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Stop</button>
                    ) : (
                      <button type="button" onClick={startRecording} className="px-4 py-2 text-sm text-white bg-slate-800 rounded-lg hover:bg-slate-900">Start</button>
                    )}
                    <button type="button" onClick={closeCamera} className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-3 md:col-span-2">
              <label htmlFor="comments" className="text-sm font-semibold text-slate-700 tracking-wide">
                Comments
              </label>
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

          {/* Message Display */}
          {message && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          )}

          {/* Buttons */}
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
              {submitting ? "Creating..." : "Create Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}