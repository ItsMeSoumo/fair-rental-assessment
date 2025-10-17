"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Lightweight Leaflet loader via CDN (no npm install). Ensures CSS+JS are present once.
function useLeafletLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.L) {
      setReady(true);
      return;
    }
    // Inject CSS
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
    // Inject JS
    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1ntcGC6A=";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    } else {
      // JS already injected but maybe not loaded
      const script = document.getElementById(jsId);
      if (window.L) setReady(true);
      else script.addEventListener("load", () => setReady(true), { once: true });
    }
  }, []);

  return ready;
}

function asJsonString(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

function clampCoord(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  if (x < min || x > max) return null;
  return x;
}

function parseLooseLocation(val) {
  if (!val) return { start: null, end: null };
  if (typeof val !== "string") return { start: null, end: null };
  let s = val.trim();
  // Try strict JSON first
  try {
    const obj = JSON.parse(s);
    if (obj) {
      if (obj.start || obj.end) {
        let sStart = obj.start || null;
        let sEnd = obj.end || null;
        if (Array.isArray(sStart) && sStart.length >= 2) {
          const lat = clampCoord(sStart[0], -90, 90);
          const lng = clampCoord(sStart[1], -180, 180);
          sStart = lat != null && lng != null ? { lat, lng } : null;
        }
        if (Array.isArray(sEnd) && sEnd.length >= 2) {
          const lat = clampCoord(sEnd[0], -90, 90);
          const lng = clampCoord(sEnd[1], -180, 180);
          sEnd = lat != null && lng != null ? { lat, lng } : null;
        }
        return { start: sStart, end: sEnd };
      }
      // alternative field shapes
      const sLat = obj.start_lat ?? obj.startLat ?? obj.sLat;
      const sLng = obj.start_lng ?? obj.startLng ?? obj.sLng;
      const eLat = obj.end_lat ?? obj.endLat ?? obj.eLat;
      const eLng = obj.end_lng ?? obj.endLng ?? obj.eLng;
      if (sLat != null && sLng != null) {
        const slat = clampCoord(sLat, -90, 90);
        const slng = clampCoord(sLng, -180, 180);
        const start = slat != null && slng != null ? { lat: slat, lng: slng } : null;
        let end = null;
        if (eLat != null && eLng != null) {
          const elat = clampCoord(eLat, -90, 90);
          const elng = clampCoord(eLng, -180, 180);
          end = elat != null && elng != null ? { lat: elat, lng: elng } : null;
        }
        return { start, end };
      }
      if ((obj.lat != null && obj.lng != null) || (obj.latitude != null && obj.longitude != null)) {
        const lat = clampCoord(obj.lat ?? obj.latitude, -90, 90);
        const lng = clampCoord(obj.lng ?? obj.longitude, -180, 180);
        if (lat != null && lng != null) return { start: { lat, lng }, end: null };
      }
    }
  } catch {}
  // Try converting single quotes to double quotes
  try {
    const cleaned = s.replace(/'/g, '"');
    const obj = JSON.parse(cleaned);
    if (obj) {
      if (obj.start || obj.end) {
        let sStart = obj.start || null;
        let sEnd = obj.end || null;
        if (Array.isArray(sStart) && sStart.length >= 2) {
          const lat = clampCoord(sStart[0], -90, 90);
          const lng = clampCoord(sStart[1], -180, 180);
          sStart = lat != null && lng != null ? { lat, lng } : null;
        }
        if (Array.isArray(sEnd) && sEnd.length >= 2) {
          const lat = clampCoord(sEnd[0], -90, 90);
          const lng = clampCoord(sEnd[1], -180, 180);
          sEnd = lat != null && lng != null ? { lat, lng } : null;
        }
        return { start: sStart, end: sEnd };
      }
      const sLat = obj.start_lat ?? obj.startLat ?? obj.sLat;
      const sLng = obj.start_lng ?? obj.startLng ?? obj.sLng;
      const eLat = obj.end_lat ?? obj.endLat ?? obj.eLat;
      const eLng = obj.end_lng ?? obj.endLng ?? obj.eLng;
      if (sLat != null && sLng != null) {
        const slat = clampCoord(sLat, -90, 90);
        const slng = clampCoord(sLng, -180, 180);
        const start = slat != null && slng != null ? { lat: slat, lng: slng } : null;
        let end = null;
        if (eLat != null && eLng != null) {
          const elat = clampCoord(eLat, -90, 90);
          const elng = clampCoord(eLng, -180, 180);
          end = elat != null && elng != null ? { lat: elat, lng: elng } : null;
        }
        return { start, end };
      }
      if ((obj.lat != null && obj.lng != null) || (obj.latitude != null && obj.longitude != null)) {
        const lat = clampCoord(obj.lat ?? obj.latitude, -90, 90);
        const lng = clampCoord(obj.lng ?? obj.longitude, -180, 180);
        if (lat != null && lng != null) return { start: { lat, lng }, end: null };
      }
    }
  } catch {}
  // Try extracting numeric coordinate pairs from free text
  const pairs = [];
  const pairRegex = /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = pairRegex.exec(s)) && pairs.length < 2) {
    const lat = clampCoord(m[1], -90, 90);
    const lng = clampCoord(m[2], -180, 180);
    if (lat != null && lng != null) pairs.push({ lat, lng });
  }
  if (pairs.length === 1) return { start: pairs[0], end: null };
  if (pairs.length >= 2) return { start: pairs[0], end: pairs[1] };
  return { start: null, end: null };
}

export default function LocationSelector({ value = "", onChange }) {
  const leafletReady = useLeafletLoader();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [rawValue, setRawValue] = useState("");

  // Initialize from incoming value
  useEffect(() => {
    setRawValue(typeof value === "string" ? value : JSON.stringify(value || ""));
    if (!value) {
      setStart(null);
      setEnd(null);
      return;
    }
    if (typeof value === "string") {
      try {
        const obj = JSON.parse(value);
        if (typeof obj === "string") {
          const { start: s, end: e } = parseLooseLocation(obj);
          setStart(s);
          setEnd(e);
        } else {
          setStart(obj?.start || null);
          setEnd(obj?.end || null);
        }
      } catch {
        const { start: s, end: e } = parseLooseLocation(value);
        setStart(s);
        setEnd(e);
      }
    } else {
      setStart(value?.start || null);
      setEnd(value?.end || null);
    }
  }, [value]);

  // Initialize map
  useEffect(() => {
    if (!leafletReady) return;
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;

    // Try to center on current location initially
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 14);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [leafletReady]);

  // Update markers when start/end change
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (start) {
      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker([start.lat, start.lng], {
          title: "Start",
        }).addTo(map);
      } else {
        startMarkerRef.current.setLatLng([start.lat, start.lng]);
      }
    } else if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }

    if (end) {
      if (!endMarkerRef.current) {
        endMarkerRef.current = L.marker([end.lat, end.lng], {
          title: "End",
        }).addTo(map);
      } else {
        endMarkerRef.current.setLatLng([end.lat, end.lng]);
      }
    } else if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }

    // Fit bounds if both exist
    if (start && end) {
      const bounds = L.latLngBounds(
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      );
      map.fitBounds(bounds.pad(0.25));
    }
  }, [leafletReady, start, end]);

  // Bubble up only when there is at least one point selected,
  // so we don't overwrite an existing string with nulls.
  useEffect(() => {
    if (!onChange) return;
    if (!start && !end) return;
    const payload = { start, end, updatedAt: new Date().toISOString() };
    onChange(asJsonString(payload));
  }, [start, end, onChange]);

  const setFromGeolocation = useCallback((type) => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        if (type === "start") setStart(coords);
        else setEnd(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const clearPoint = useCallback((type) => {
    if (type === "start") setStart(null);
    else setEnd(null);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFromGeolocation("start")}
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900"
        >
          Set Start (My Location)
        </button>
        {start && (
          <button
            type="button"
            onClick={() => clearPoint("start")}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear Start
          </button>
        )}
        <button
          type="button"
          onClick={() => setFromGeolocation("end")}
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900"
        >
          Set End (My Location)
        </button>
        {end && (
          <button
            type="button"
            onClick={() => clearPoint("end")}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear End
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold">Start:</span>
          <span className="ml-2">{start ? `${start.lat}, ${start.lng}` : "—"}</span>
        </div>
        <div>
          <span className="font-semibold">End:</span>
          <span className="ml-2">{end ? `${end.lat}, ${end.lng}` : "—"}</span>
        </div>
      </div>

      {!start && !end && rawValue && (
        <div className="text-xs text-slate-500">
          Saved location: <span className="font-mono break-all">{rawValue}</span>
        </div>
      )}
    </div>
  );
}

