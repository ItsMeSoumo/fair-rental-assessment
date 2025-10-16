import Link from "next/link";
import { connectDB } from "@/lib/dbConfig";
import Reservation from "@/models/reservation";
import EditForm from "./EditForm";

export default async function EditPage(props) {
  const { id } = await props.params;
  await connectDB();
  const doc = await Reservation.findById(id).lean();
  // Ensure we pass a plain JSON-serializable object to the Client Component
  const data = doc ? JSON.parse(JSON.stringify(doc)) : null;
  console.log("[PAGE] /edit/" + id, {
    found: !!data,
    id: data?._id ? String(data._id) : null,
    name: data?.name || null,
  });
  console.log("[PAGE] data:", data);

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">Reservation not found.</p>
        <Link href="/reservation-list" className="text-slate-700 underline">Back to list</Link>
      </div>
    );
  }

  return <EditForm reservation={data} />;
}

