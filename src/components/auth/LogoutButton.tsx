"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {

  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (

    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl transition"
    >
      Déconnexion
    </button>

  );
}