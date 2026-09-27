import { redirect } from "next/navigation";

/**
 * Customer registration via email/password has been removed.
 * Customers authenticate exclusively through Google OAuth.
 * Redirect any stale links to the login page.
 */
export default function RegisterPage() {
  redirect("/auth/login");
}
