import type { Config } from "@netlify/functions";
import { checkCoverage, GARAGE } from "../../src/lib/geo";

export default async (req: Request) => {
  const { zip } = (await req.json().catch(() => ({}))) as { zip?: string };

  if (!zip || !/^\d{5}$/.test(zip.trim())) {
    return Response.json({ error: "Enter a 5-digit ZIP code." }, { status: 400 });
  }

  return Response.json(checkCoverage(zip, GARAGE));
};

export const config: Config = {
  path: "/api/coverage",
  method: ["POST"],
};
