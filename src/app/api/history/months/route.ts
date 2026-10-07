import type { NextRequest } from "next/server";
import { historyMonths } from "@/lib/entries";
import { badRequest, unauthorized } from "@/lib/http";
import { currentUserId } from "@/lib/session";
import { yearParam } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = yearParam.safeParse(request.nextUrl.searchParams.get("year"));
  if (!parsed.success) {
    return badRequest("year is required (2000-2100)");
  }

  const months = await historyMonths(userId, parsed.data);
  return Response.json({ year: parsed.data, months });
}
