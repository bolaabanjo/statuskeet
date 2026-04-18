"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";

interface UserData {
  name: string;
  email: string;
}

interface OrgData {
  name: string;
  slug: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/incidents",
    label: "Incidents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "API Keys",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const orgData = localStorage.getItem("org");
      const userData = localStorage.getItem("user");

      if (!cancelled) {
        if (orgData) setOrg(JSON.parse(orgData));
        if (userData) setUser(JSON.parse(userData));
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    queueMicrotask(() => {
      setSidebarOpen(false);
    });
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("org");
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background">
        <div className="px-4 h-12 flex items-center justify-between">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-0">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-2 p-1.5 text-muted-foreground hover:text-white transition lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/" className="flex items-center pr-2.5">
              <Image src="/logo.png" alt="StatusKeet" width={20} height={20} />
            </Link>

            <span className="text-white/10 text-lg select-none">/</span>

            {/* Org switcher */}
            <div className="relative" ref={orgMenuRef}>
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-none hover:bg-white/[0.04] transition"
              >
                <span className="text-[13px] font-semibold text-foreground font-heading italic truncate max-w-[140px] sm:max-w-none">
                  {org?.name || "Organization"}
                </span>
                <span className="text-[9px] font-medium text-muted-foreground bg-white/[0.06] px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline">
                  Free
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted-foreground ml-0.5 shrink-0">
                  <path d="M5 6.5L8 4L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9.5L8 12L11 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {orgMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-none z-50 py-1 shadow-2xl">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Organization</p>
                  </div>
                  <div className="p-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-none bg-white/[0.04]">
                      <Avatar name={org?.name || "O"} size="xs" variant="green" className="rounded-none font-sans" />
                      <span className="text-xs text-foreground font-medium">{org?.name}</span>
                      <svg className="w-3.5 h-3.5 text-green-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="border-t border-border p-1 mt-1">
                    <button className="w-full text-left px-2 py-1.5 rounded-none text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                      Create organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: status page link + avatar */}
          <div className="flex items-center gap-3">
            {org?.slug && (
              <Link
                href={`/s/${org.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="hidden sm:inline">Status page</span>
              </Link>
            )}
            {user && (
              <div className="relative" ref={avatarMenuRef}>
                <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}>
                  <Avatar
                    name={user.name}
                    size="md"
                    variant="muted"
                    className="cursor-pointer hover:ring-2 hover:ring-white/10 transition rounded-full"
                  />
                </button>

                {avatarMenuOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-60 bg-background border border-border rounded-none z-50 py-1 shadow-2xl">
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      {user.email && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{user.email}</p>
                      )}
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-2 py-1.5 rounded-none text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
                        onClick={() => setAvatarMenuOpen(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-none text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        Theme
                      </button>
                    </div>
                    <div className="border-t border-border p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-none text-xs text-muted-foreground hover:text-red-400 hover:bg-white/[0.04] transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-12 bottom-0 left-0 z-30 w-52 border-r border-border bg-background transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-none text-xs transition border-l-2 ${
                    active
                      ? "text-foreground bg-white/[0.04] border-primary font-bold shadow-[2px_0_10px_rgba(34,197,94,0.05)]"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/[0.02]"
                  }`}
                >
                  <span className={active ? "text-primary" : "text-muted-foreground"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-4 border-t border-border">
            {org?.slug && (
              <Link
                href={`/s/${org.slug}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-none text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.02] transition border border-border/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Status page
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-12 lg:pl-52">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
