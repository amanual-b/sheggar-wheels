import { Suspense } from "react";
import SignInView from "@/components/views/SignInView";
import { PageLoading } from "@/components/States";

export const metadata = { title: "Sign in", description: "Sign in to Sheggar Wheels.", robots: { index: false } };

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container section"><PageLoading /></div>}>
      <SignInView />
    </Suspense>
  );
}
