import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConfig";
import Reservation from "@/models/reservation";
import { UploadImage } from "@/lib/uploadImage";

// Add Reservation
export async function POST(request) {
  try {
    await connectDB();

    // Expecting multipart FormData from client. Use form.get(...) to read values.
    const form = await request.formData();
    const file = form.get("image") || form.get("file");
    const videoFile = form.get("video");
    const hasImage = !!file;
    const hasVideo = !!videoFile;

    // Basic payload mapping and defaults
    const data = {
      reservation_no: form.get("reservation_no") || "",
      name: form.get("name"),
      contact_no: form.get("contact_no") || "",
      comments: form.get("comments") || "",
      image_url: "",
      public_id: "",
      video_url: "",
      video_public_id: "",
    };

    // If a file is provided, try uploading; otherwise skip
    if (hasImage && file && typeof file.arrayBuffer === "function") {
      try {
        const uploaded = await UploadImage(file, "reservations");
        data.image_url = uploaded?.secure_url || "";
        data.public_id = uploaded?.public_id || "";
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
        // keep proceeding without image instead of failing the whole request
      }
    }

    if (hasVideo && videoFile && typeof videoFile.arrayBuffer === "function") {
      try {
        const uploadedVid = await UploadImage(videoFile, "reservations");
        data.video_url = uploadedVid?.secure_url || "";
        data.video_public_id = uploadedVid?.public_id || "";
      } catch (uploadErr) {
        console.error("Video upload failed:", uploadErr);
        // keep proceeding without video instead of failing the whole request
      }
    }

    const created = await Reservation.create(data);
    return NextResponse.json(
      {
        success: true,
        reservation: created,
        imageStatus: hasImage ? (data.image_url ? "uploaded" : "received-no-url") : "no image",
        videoStatus: hasVideo ? (data.video_url ? "uploaded" : "received-no-url") : "no video",
        imageUrl: data.image_url || null,
        publicId: data.public_id || null,
        videoUrl: data.video_url || null,
        videoPublicId: data.video_public_id || null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create reservation error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// List Reservations
export async function GET() {
  try {
    await connectDB();
    const items = await Reservation.find({}).sort({ created_at: -1 }).lean();
    return NextResponse.json({ success: true, reservations: items }, { status: 200 });
  } catch (err) {
    console.error("List reservations error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// Delete Reservation
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reservation ID is required" }, { status: 400 });
    }

    const deleted = await Reservation.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Reservation deleted successfully", deleted },
      { status: 200 }
    );
  } catch (err) {
    console.error("Delete reservation error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

