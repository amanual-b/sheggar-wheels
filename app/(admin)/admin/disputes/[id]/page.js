import AdminDisputeDetailView from "@/components/views/AdminDisputeDetailView";

export const metadata = { title: "Resolve dispute" };

export default async function AdminDisputePage({ params }) {
  const { id } = await params;
  return <AdminDisputeDetailView id={id} />;
}
