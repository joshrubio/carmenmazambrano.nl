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
        className="label bg-accent text-inverse px-3 py-0.5 leading-none hover:opacity-90 transition-opacity"
      >
        Redactar
      </Link>
    );
  }

  return (
    <Link
      href="/admin/login"
      className="label bg-accent text-inverse px-3 py-0.5 leading-none hover:opacity-90 transition-opacity"
    >
      Login
    </Link>
  );
}
