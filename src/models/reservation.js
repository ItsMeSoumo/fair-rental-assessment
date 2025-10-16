import mongoose, { Schema } from "mongoose";

const ReservationSchema = new Schema(
  {
    reservation_no: { type: String, index: true },
    name: { type: String, required: true },
    contact_no: { type: String },
    comments: { type: String }, // HTML string
    generated_link: { type: String },
    image_url: { type: String },
    public_id: { type: String },
    video_url: { type: String },
    video_public_id: { type: String },
    // Store as raw JSON string for now to match your sample. You can change to an object later.
    location: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

if (mongoose.models.Reservation) {
  mongoose.deleteModel("Reservation");
}
const Reservation = mongoose.model("Reservation", ReservationSchema);

export default Reservation;

