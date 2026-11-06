import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Tracker from "@/components/permit/Tracker";
import type { Permit, Status } from "@/lib/permits";

export const metadata: Metadata = {
  title: "Permit Tracker | Python data pipeline demo",
  description:
    "New building permits from US city open-data portals, cleaned, validated and mapped by a Python pipeline.",
};

function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export default function Page() {
  const permits = readJson<Permit[]>("permits.json", []);
  const status = readJson<Status | null>("status.json", null);
  return <Tracker permits={permits} status={status} />;
}
