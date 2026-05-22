import { auth } from "@/auth";
import { createUser, getUserByAuthSubject } from "@/lib/cosmos";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();

  if (!session) {
    return null;
  }

  const authSubject = session.user?.id || session.user?.email;

  if (!authSubject) {
    return null;
  }

  const existing = await getUserByAuthSubject(authSubject);

  if (existing) {
    return existing.id;
  }

  const created = await createUser({
    auth_subject: authSubject,
    locale: "en-PH",
  });

  return created.id;
}
