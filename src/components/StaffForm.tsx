"use client";

import { useActionState } from "react";
import { createStaffAction, type FormState } from "@/app/actions";

const field =
  "w-full rounded-xl border border-line bg-page px-4 py-3 text-ink placeholder:text-muted/60 outline-none transition focus:border-brand/60";
const label = "mb-1.5 block text-[13px] font-medium text-muted";

/** Drivers and mechanics never sign themselves up — an admin creates them here. */
export function StaffForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createStaffAction,
    {},
  );

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-5">
      <p className="eyebrow text-brand">Add a driver or mechanic</p>
      <p className="mt-2 text-[14px] text-muted">
        They&rsquo;ll sign in with this email and password. Give them the
        details directly — nothing is emailed out yet.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="s-name">Name</label>
          <input id="s-name" name="name" placeholder="Dave Papadopoulos" defaultValue={state?.values?.name ?? ""} key={state?.values?.name} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="s-role">Role</label>
          <select id="s-role" name="role" defaultValue="driver" className={field}>
            <option value="driver">Driver</option>
            <option value="mechanic">Mechanic</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="s-email">Email</label>
          <input id="s-email" name="email" type="email" placeholder="dave@tooeasy.com.au" defaultValue={state?.values?.email ?? ""} key={state?.values?.email} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="s-phone">Mobile (optional)</label>
          <input id="s-phone" name="phone" type="tel" placeholder="0412 345 678" defaultValue={state?.values?.phone ?? ""} key={state?.values?.phone} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="s-password">Temporary password</label>
          <input id="s-password" name="password" placeholder="At least 8 characters" className={field} />
        </div>
      </div>

      {state?.error && (
        <p className="mt-4 rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-[14px] text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.07] px-4 py-3 text-[14px]">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
