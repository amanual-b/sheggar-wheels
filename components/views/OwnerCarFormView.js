"use client";
import useSWR from "swr";
import CarForm from "@/components/CarForm";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { getOwnerCar } from "@/lib/cars";

/** New listing (no id) or edit (id). Ownership is enforced in getOwnerCar and again in saveCarListing. */
export default function OwnerCarFormView({ id }) {
  const { data: res } = useSWR(id ? ["sw", "ownerCar", id] : null, () => getOwnerCar(id));
  if (!id) {
    return (
      <div className="stack-lg">
        <PageHeader title="Add a car" subtitle="Admins review new listings before they appear publicly." />
        <CarForm />
      </div>
    );
  }
  if (res === undefined) return <PageLoading label="Loading listing…" />;
  if (!res.ok) {
    return (
      <ErrorState title={res.error === "Not yours" ? "You can only edit your own cars" : res.error} actionHref="/owner/cars" actionLabel="Back to my cars">
        {res.error === "Not yours" ? "That listing belongs to another owner." : null}
      </ErrorState>
    );
  }
  return (
    <div className="stack-lg">
      <PageHeader title={`Edit ${res.data.make} ${res.data.model}`} />
      <CarForm car={res.data} />
    </div>
  );
}
