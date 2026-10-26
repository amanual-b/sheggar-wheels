import AdminUserDetailView from "@/components/views/AdminUserDetailView";

export const metadata = { title: "User details" };

export default async function AdminUserPage({ params }) {
  const { id } = await params;
  return <AdminUserDetailView id={id} />;
}
