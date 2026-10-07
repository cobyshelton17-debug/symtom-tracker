import type { z } from "zod";

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function zodError(error: z.ZodError) {
  const message = error.issues[0]?.message ?? "Invalid input";
  return badRequest(message);
}
