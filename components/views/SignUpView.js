"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@/components/Form";
import { useToast } from "@/components/Toast";
import { refreshData } from "@/lib/hooks";
import { createDemoAccount } from "@/lib/users";
import { defaultLanding, safeReturnPath } from "@/lib/session";

export default function SignUpView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", alsoOwner: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const rawNext = params.get("next");

  const submit = (e) => {
    e.preventDefault();
    const res = createDemoAccount(form);
    if (!res.ok) {
      setErrors(res.errors || {});
      setFormError(res.error);
      return;
    }
    refreshData();
    toast.success(`Welcome, ${res.data.name.split(" ")[0]}! Your account is ready.`);
    router.push(rawNext ? safeReturnPath(rawNext) : defaultLanding(res.data));
  };

  return (
    <div className="container section" style={{ maxWidth: 620 }}>
      <h1>Create your account</h1>
      <p className="muted">You start as a renter and can also enable owner tools on the same account. No password is required in this version.</p>
      <form className="card card-body stack" onSubmit={submit} noValidate aria-label="Create account">
        {formError ? <div className="alert alert-error" role="alert">{formError}</div> : null}
        <TextField label="Full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" required />
        <TextField label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" required />
        <TextField label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} hint="Ethiopian mobile, e.g. 0911 123 456" autoComplete="tel" />
        <label className="check-row">
          <input type="checkbox" checked={form.alsoOwner} onChange={set("alsoOwner")} />
          I also want to list my own car (owner tools)
        </label>
        <button type="submit" className="btn btn-primary">Create account</button>
        <p className="hint" style={{ margin: 0 }}>Administrator accounts cannot be created here.</p>
      </form>
      <p style={{ marginTop: 16 }}>Already have an account? <Link href="/signin">Sign in</Link>.</p>
    </div>
  );
}
