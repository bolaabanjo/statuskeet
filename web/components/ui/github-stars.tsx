/**
 * GitHubStars — Displays a GitHub repo's star count with the GitHub mark.
 *
 * ─────────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────
 *
 * 1. STATIC / SSR
 *    On first render (server or static), the component shows the
 *    `fallback` count you provide. No client-side fetch fires
 *    during SSR, so there's no layout shift or hydration mismatch.
 *
 * 2. CLIENT HYDRATION
 *    After mount, a `useEffect` fires a single `fetch` to the
 *    GitHub REST API (`/repos/:owner/:repo`) and reads
 *    `stargazers_count`. The displayed count updates in place.
 *    If the fetch fails (rate limit, network), the fallback
 *    stays visible — no error state shown.
 *
 * 3. FORMATTING
 *    Counts are formatted with `compactCount`:
 *    - < 1,000 → "842"
 *    - 1,000–9,999 → "2.4K"
 *    - 10,000–999,999 → "99.3K"
 *    - 1,000,000+ → "1.2M"
 *
 * 4. GITHUB MARK
 *    Uses an inline SVG of the GitHub Invertocat mark. No
 *    external image request, no FOUC, works in any color scheme.
 *
 * ─────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { GitHubStars } from "@/components/ui/github-stars";
 *
 * // Basic usage with fallback
 * <GitHubStars owner="statuskeet" repo="statuskeet" fallback={1200} />
 *
 * // Custom size and color
 * <GitHubStars
 *   owner="vercel"
 *   repo="next.js"
 *   fallback={128000}
 *   iconSize={20}
 *   className="text-white"
 * />
 *
 * // As a link (default — wraps in an <a> to the repo)
 * <GitHubStars owner="statuskeet" repo="statuskeet" fallback={0} />
 *
 * // Without link
 * <GitHubStars owner="statuskeet" repo="statuskeet" fallback={0} link={false} />
 * ```
 *
 * ─────────────────────────────────────────────────────────────
 * PROPS
 * ─────────────────────────────────────────────────────────────
 *
 * | Prop      | Type    | Default | Description                                    |
 * |-----------|---------|---------|------------------------------------------------|
 * | owner     | string  | —       | GitHub org or user (e.g. "statuskeet")          |
 * | repo      | string  | —       | Repository name (e.g. "statuskeet")             |
 * | fallback  | number  | 0       | Star count shown before client fetch completes  |
 * | iconSize  | number  | 18      | Width/height of the GitHub mark in pixels        |
 * | link      | boolean | true    | Wrap in an anchor to the GitHub repo             |
 * | className | string  | ""      | Additional classes on the outer element           |
 */

"use client";

import { useEffect, useState } from "react";

interface GitHubStarsProps {
  /** GitHub org or user */
  owner: string;
  /** Repository name */
  repo: string;
  /** Star count shown before client fetch completes */
  fallback?: number;
  /** Width/height of the GitHub mark in pixels */
  iconSize?: number;
  /** Wrap in an anchor to the GitHub repo */
  link?: boolean;
  /** Additional classes on the outer element */
  className?: string;
}

function compactCount(n: number): string {
  if (n < 1_000) return n.toString();
  if (n < 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

function GitHubMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function GitHubStars({
  owner,
  repo,
  fallback = 0,
  iconSize = 18,
  link = true,
  className = "",
}: GitHubStarsProps) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    fetch(`https://api.github.com/repos/${owner}/${repo}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data?.stargazers_count != null) {
          setCount(data.stargazers_count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  const content = (
    <span className={`inline-flex items-center gap-1.5 leading-none ${className}`}>
      <GitHubMark size={iconSize} />
      <span className="font-medium tabular-nums translate-y-px">{compactCount(count)}</span>
    </span>
  );

  if (link) {
    return (
      <a
        href={`https://github.com/${owner}/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default GitHubStars;
