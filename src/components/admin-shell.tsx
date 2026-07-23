"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/admin/agentes", label: "Agentes" },
  { href: "/admin/usuarios", label: "Usuários", adminOnly: true },
];

export function AdminShell({
  role,
  email,
  children,
}: {
  role: Role;
  email: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="w-60 shrink-0 border-r border-neutral-800 p-4">
        <p className="mb-6 text-sm font-semibold text-neutral-300">
          Painel de Agentes
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.filter((item) => !item.adminOnly || role === "admin").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
          <span className="text-sm text-neutral-400">{email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Sair
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
