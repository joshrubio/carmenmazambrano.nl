"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminButton() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return null;

  if (authenticated) {
    return (
      <Link
        href="/admin/new"
        className="label text-accent font-normal hover:text-ink transition-colors"
      >
        Redactar
      </Link>
    );
  }

  return (
    <Link
      href="/admin/login"
      className="label text-muted font-normal hover:text-accent transition-colors"
    >
      Iniciar sesión
    </Link>
  );
}
