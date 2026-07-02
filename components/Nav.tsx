"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/blindspot-history", label: "Blindspot History" },
  { href: "/coverage-gap", label: "Coverage Gap" },
  { href: "/analyze", label: "Analyze Article" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <span className="grid grid-cols-2 gap-[2px]">
              <span className="h-2 w-2 bg-right-blindspot" />
              <span className="h-2 w-2 bg-balanced" />
              <span className="h-2 w-2 bg-balanced" />
              <span className="h-2 w-2 bg-left-blindspot" />
            </span>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-text-primary">
            Blindspot Tracker
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                  active
                    ? "text-highlight"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center border border-hairline text-text-secondary md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-transform",
                open && "translate-y-1.5 rotate-45"
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-opacity",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 bg-current transition-transform",
                open && "-translate-y-1.5 -rotate-45"
              )}
            />
          </div>
        </button>
      </div>

      {open && (
        <nav className="border-t border-hairline md:hidden">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block border-b border-hairline px-4 py-3 font-mono text-xs uppercase tracking-wider",
                  active ? "text-highlight" : "text-text-secondary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
