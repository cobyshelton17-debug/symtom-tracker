import type { NextRequest } from "next/server";
import { createEntry, listEntries } from "@/lib/entries";
import { badRequest, unauthorized, zodError } from "@/lib/http";
import { currentUserId } from "@/lib/session";
import { entrySchema, entriesQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = entriesQuerySchema.safeParse(params);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(issue ? issue.message : "Invalid query parameters");
  }

  const entries = await listEntries(userId, parsed.data);
  return Response.json({ entries });
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON");
  }

  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return zodError(parsed.error);
  }

  const entry = await createEntry(userId, parsed.data);
  return Response.json({ entry }, { status: 201 });
}
