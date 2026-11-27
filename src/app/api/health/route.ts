import { NextResponse } from "next/server";

// Lightweight platform-agnostic liveness endpoint for load balancers and container hosts.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "ekhaya-ecommerce" }, { status: 200 });
}
