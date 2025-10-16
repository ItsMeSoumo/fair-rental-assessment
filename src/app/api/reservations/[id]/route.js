import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConfig";
import Reservation from "@/models/reservation";
import { UploadImage } from "@/lib/uploadImage";

// GET /api/reservations/[id]
export async function GET(_req, { params }) {
  try {
    await connectDB();
    const doc = await Reservation.findById(params.id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Return a consistent shape like other endpoints
    return NextResponse.json({ reservation: doc }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// PUT /api/reservations/[id]
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const update = {};

    // Try to parse multipart form first; fallback to JSON
    let form = null;
    let isForm = false;
    try {
      form = await request.formData();
      isForm = true;
    } catch (_) {
      isForm = false;
    }

    if (isForm) {
      console.log("[API PUT] multipart form received for", params.id);
      update.reservation_no = form.get("reservation_no") || "";
      update.name = form.get("name") || "";
      update.contact_no = form.get("contact_no") || "";
      update.comments = form.get("comments") || "";

      const image = form.get("image");
      if (image && typeof image.arrayBuffer === "function") {
        try {
          const up = await UploadImage(image, "reservations");
          update.image_url = up?.secure_url || "";
          update.public_id = up?.public_id || "";
          console.log("[API PUT] image uploaded", update.image_url);
        } catch (_) {}
      }
      const video = form.get("video");
      if (video && typeof video.arrayBuffer === "function") {
        try {
          const upv = await UploadImage(video, "reservations");
          update.video_url = upv?.secure_url || "";
          update.video_public_id = upv?.public_id || "";
          console.log("[API PUT] video uploaded", update.video_url);
        } catch (_) {}
      }
    } else {
      const body = await request.json().catch(() => ({}));
      console.log("[API PUT] JSON body received for", params.id, Object.keys(body));
      if (Object.prototype.hasOwnProperty.call(body, "reservation_no")) update.reservation_no = body.reservation_no || "";
      if (Object.prototype.hasOwnProperty.call(body, "name")) update.name = body.name || "";
      if (Object.prototype.hasOwnProperty.call(body, "contact_no")) update.contact_no = body.contact_no || "";
      if (Object.prototype.hasOwnProperty.call(body, "comments")) update.comments = body.comments || "";
    }

    const doc = await Reservation.findByIdAndUpdate(params.id, update, { new: true });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.log("[API PUT] updated doc", params.id, {
      image_url: doc.image_url,
      video_url: doc.video_url,
    });
    return NextResponse.json({ reservation: doc }, { status: 200 });
  } catch (err) {
    console.error("[API PUT] error", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/reservations/[id]
export async function DELETE(_req, { params }) {
  try {
    await connectDB();
    const doc = await Reservation.findByIdAndDelete(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

