import { NextResponse } from "next/server";
import { COOKIE_PANEL } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_PANEL, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
