import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginPage } from "@/components/LoginPage";

export default async function Login() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (isAuthenticated) {
    redirect("/");
  }
  
  return <LoginPage />;
}
