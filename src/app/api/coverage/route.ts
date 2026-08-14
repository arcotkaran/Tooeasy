import { NextResponse } from "next/server";
import { checkCoverage } from "@/lib/geo";
import { getPrimaryGarage } from "@/lib/garage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { zip } = (await req.json().catch(() => ({}))) as { zip?: string };

  if (!zip || !/^\d{5}$/.test(zip.trim())) {
    return NextResponse.json(
      { error: "Enter a 5-digit ZIP code." },
      { status: 400 },
    );
  }

  const garage = await getPrimaryGarage();
  return NextResponse.json(checkCoverage(zip, garage));
}
