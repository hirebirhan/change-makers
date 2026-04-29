import { redirect } from "next/navigation";
import { LoginPage } from "@/components/LoginPage";
import { getCurrentUser, isLegacyAuthenticated } from "@/lib/auth/session";

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const legacyAuthenticated = !user && await isLegacyAuthenticated();

  if (user || legacyAuthenticated) {
    redirect("/");
  }

  const params = await searchParams;
  return <LoginPage errorMessage={decodeLoginError(params?.error)} />;
}

function decodeLoginError(value: string | undefined) {
  if (!value) return undefined;
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "Authentication could not be started. Check the OAuth configuration.";
  }
}
