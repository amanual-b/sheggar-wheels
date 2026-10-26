import { Suspense } from "react";
import SignUpView from "@/components/views/SignUpView";
import { PageLoading } from "@/components/States";

export const metadata = { title: "Create an account", description: "Create a renter account. Owner tools can be enabled on the same account.", robots: { index: false } };

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="container section"><PageLoading /></div>}>
      <SignUpView />
    </Suspense>
  );
}
