import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>;
}) {
  const { zip } = await searchParams;
  const session = await auth();

  if (!session?.user) {
    const next = zip ? `/book?zip=${encodeURIComponent(zip)}` : "/book";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <AppShell>
      <BookingForm
        initialZip={(zip ?? "").replace(/\D/g, "").slice(0, 5)}
        defaultName={session.user.name ?? ""}
      />
    </AppShell>
  );
}
