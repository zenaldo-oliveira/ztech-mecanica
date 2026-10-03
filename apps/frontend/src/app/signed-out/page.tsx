import { redirect } from "next/navigation";

// Rota legada do protótipo (logout simulado). O logout real (POST /api/v1/auth/logout)
// leva direto a /login; mantida apenas para links antigos.
export default function SignedOutPage() {
  redirect("/login");
}
