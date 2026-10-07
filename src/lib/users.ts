import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { registerSchema } from "@/lib/validation";
import type { z } from "zod";

export type RegisterInput = z.infer<typeof registerSchema>;

export type CreateUserResult =
  | { ok: true; user: { id: string; email: string | null; name: string | null } }
  | { ok: false; error: "email_taken" };

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function createUser(input: RegisterInput): Promise<CreateUserResult> {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: input.name ?? null,
      },
    });
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "email_taken" };
    }
    throw error;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user?.passwordHash) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name };
}
