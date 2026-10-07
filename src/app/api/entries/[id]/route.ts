import { deleteEntry, getEntry, updateEntry } from "@/lib/entries";
import { badRequest, notFound, unauthorized, zodError } from "@/lib/http";
import { currentUserId } from "@/lib/session";
import { entryUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Context) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  const entry = await getEntry(userId, id);
  if (!entry) return notFound("Entry not found");

  return Response.json({ entry });
}

export async function PATCH(request: Request, ctx: Context) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON");
  }

  const parsed = entryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return zodError(parsed.error);
  }

  const entry = await updateEntry(userId, id, parsed.data);
  if (!entry) return notFound("Entry not found");

  return Response.json({ entry });
}

export async function DELETE(_request: Request, ctx: Context) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  const deleted = await deleteEntry(userId, id);
  if (!deleted) return notFound("Entry not found");

  return Response.json({ ok: true });
}
