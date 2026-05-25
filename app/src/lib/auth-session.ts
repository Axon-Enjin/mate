import { auth } from "@/auth";
import { createUser, getUserByAuthSubject, updateUser } from "@/lib/cosmos";

/**
 * Resolve the Mate user id for the signed-in session.
 * Uses Microsoft Entra object id (token.sub) as the stable auth_subject.
 * Migrates legacy users that were keyed by email on first login after fix.
 */
export async function requireUserId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const authSubject = session.user.id;

  let existing = await getUserByAuthSubject(authSubject);
  if (existing) {
    return existing.id;
  }

  // Legacy: accounts created when auth_subject was email instead of Entra oid
  const email = session.user.email;
  if (email && email !== authSubject) {
    const legacy = await getUserByAuthSubject(email);
    if (legacy) {
      await updateUser(legacy.id, { auth_subject: authSubject });
      return legacy.id;
    }
  }

  const created = await createUser({
    auth_subject: authSubject,
    locale: "en-PH",
  });

  return created.id;
}
