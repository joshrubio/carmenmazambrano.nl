"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localePath, type Locale } from "@/i18n/config";

// Los botones de administración están siempre en español (el panel no se traduce);
// solo el "Login" público sigue el idioma de la web.
export function AdminButton({ lang, loginLabel }: { lang: Locale; loginLabel: string }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    router.push(localePath(lang));
  }

  if (authenticated === null) return null;

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/admin/new"
          className="label bg-accent text-inverse px-3 py-1 leading-none hover:opacity-90 transition-opacity"
        >
          Redactar
        </Link>
        <button
          onClick={handleLogout}
          className="label bg-ink text-inverse px-3 py-1 leading-none hover:opacity-80 transition-opacity"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/admin/login"
      className="label bg-accent text-inverse px-3 py-1 leading-none hover:opacity-90 transition-opacity"
    >
      {loginLabel}
    </Link>
  );
}
