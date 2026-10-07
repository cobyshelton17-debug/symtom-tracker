import { historyYears } from "@/lib/entries";
import { unauthorized } from "@/lib/http";
import { currentUserId } from "@/lib/session";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const years = await historyYears(userId);
  return Response.json({ years });
}
