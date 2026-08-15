"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction, type FormState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none transition focus:border-brand/60";
const label = "mb-1.5 block text-[13px] font-medium text-muted";
const submit =
  "w-full rounded-full bg-brand px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60";

function Error({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-[14px] text-red-700">
      {state.error}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signInAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={label} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" defaultValue={state?.values?.email ?? ""} key={state?.values?.email} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className={field} />
      </div>
      <Error state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-[14px] text-muted">
        No account?{" "}
        <Link href="/signup" className="text-brand underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUpAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={label} htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" placeholder="Alex Nguyen" defaultValue={state?.values?.name ?? ""} key={state?.values?.name} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" defaultValue={state?.values?.email ?? ""} key={state?.values?.email} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="phone">Mobile (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0412 345 678" defaultValue={state?.values?.phone ?? ""} key={state?.values?.phone} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className={field} />
      </div>
      <Error state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Creating your profile…" : "Create my profile"}
      </button>
      <p className="text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brand underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
