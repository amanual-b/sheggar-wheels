import OwnerCarFormView from "@/components/views/OwnerCarFormView";

export const metadata = { title: "Edit listing" };

export default async function EditCarPage({ params }) {
  const { id } = await params;
  return <OwnerCarFormView id={id} />;
}
