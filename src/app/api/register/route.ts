import { createUser } from "@/lib/users";
import { badRequest, zodError } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return zodError(parsed.error);
  }

  const result = await createUser(parsed.data);
  if (!result.ok) {
    return Response.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  return Response.json({ user: result.user }, { status: 201 });
}
