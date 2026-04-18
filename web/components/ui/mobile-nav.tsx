"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-muted-foreground hover:text-foreground transition"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-11 left-0 right-0 bg-background border-b border-border px-4 py-4 space-y-3">
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="block text-sm text-muted-foreground hover:text-foreground transition"
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block text-sm text-muted-foreground hover:text-foreground transition"
          >
            Pricing
          </Link>
          <Link
            href="/changelog"
            onClick={() => setOpen(false)}
            className="block text-sm text-muted-foreground hover:text-foreground transition"
          >
            Changelog
          </Link>
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold h-9 px-4 inline-flex items-center justify-center rounded-none border border-border text-foreground hover:bg-foreground/5 transition uppercase tracking-widest"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold h-9 px-4 inline-flex items-center justify-center rounded-none bg-foreground text-background hover:bg-foreground/90 transition uppercase tracking-widest"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
