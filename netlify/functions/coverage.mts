import type { Config } from "@netlify/functions";
import { checkCoverage, WORKSHOP } from "../../src/lib/geo";

export default async (req: Request) => {
  const { postcode } = (await req.json().catch(() => ({}))) as {
    postcode?: string;
  };

  if (!postcode || !/^\d{4}$/.test(postcode.trim())) {
    return Response.json(
      { error: "Enter a 4-digit postcode." },
      { status: 400 },
    );
  }

  return Response.json(checkCoverage(postcode, WORKSHOP));
};

export const config: Config = {
  path: "/api/coverage",
  method: ["POST"],
};
