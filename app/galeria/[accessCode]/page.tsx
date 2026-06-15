import { redirect } from "next/navigation";

export default function LegacyGalleryPage() {
  redirect("/login?next=/galeria");
}
