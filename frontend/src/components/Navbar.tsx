"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Landmark, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const links = [
  { href: "/", label: "Home" },
  { href: "/intake", label: "Check Eligibility" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/applications", label: "My Applications" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-navy text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid place-items-center h-9 w-9 rounded-full bg-saffron text-white">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="font-bold text-lg tracking-tight">
            Nidhi<span className="text-saffron">Setu</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === link.href ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/admin"
                className={`hidden sm:inline-flex px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === "/admin" ? "bg-white/10" : "text-slate-200 hover:bg-white/5"
                }`}
              >
                Admin
              </Link>
              <span className="hidden sm:inline text-sm text-slate-300 max-w-[160px] truncate">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-saffron text-white hover:brightness-95 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}