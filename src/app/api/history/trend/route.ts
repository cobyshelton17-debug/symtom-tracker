import type { NextRequest } from "next/server";
import { trendBySymptom } from "@/lib/entries";
import { badRequest, unauthorized } from "@/lib/http";
import { currentUserId } from "@/lib/session";
import { monthParam, yearParam } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const year = yearParam.safeParse(request.nextUrl.searchParams.get("year"));
  if (!year.success) {
    return badRequest("year is required (2000-2100)");
  }

  const month = monthParam.safeParse(request.nextUrl.searchParams.get("month"));
  if (!month.success) {
    return badRequest("month is required (1-12)");
  }

  const trend = await trendBySymptom(userId, year.data, month.data);
  return Response.json(trend);
}
