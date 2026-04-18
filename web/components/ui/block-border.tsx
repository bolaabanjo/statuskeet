/**
 * BlockBorder — A grid-border layout component for dark UIs.
 *
 * Renders a container with a faint outer border and an internal grid overlay
 * made from CSS `repeating-linear-gradient`. Optional crosshair marks (+) sit
 * at each corner where grid lines intersect.
 *
 * ─────────────────────────────────────────────────────────────
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────
 *
 * 1. OUTER BORDER
 *    The container gets `border: 1px solid` using a configurable color at
 *    very low opacity (default `rgba(255,255,255,0.06)`). This creates the
 *    visible rectangle that frames the content.
 *
 * 2. GRID OVERLAY
 *    `repeating-linear-gradient` is applied via inline `backgroundImage`.
 *    - Column lines: a horizontal gradient that repeats at `100 / cols`%
 *      intervals, drawing a 1px vertical stripe at each division.
 *    - Row lines: a vertical gradient that repeats at `100 / rows`%
 *      intervals, drawing a 1px horizontal stripe at each division.
 *    Both gradients use the same color as the outer border so every line
 *    has identical visual weight. When `cols` or `rows` is 1 (default),
 *    that axis has no gradient — no extra lines are rendered.
 *
 * 3. CROSSHAIR MARKS
 *    Each corner gets a `CrossMark` — two perpendicular 1px divs (one
 *    18px wide, one 18px tall) centered on each other. They are positioned
 *    with `absolute` at each corner of the container, offset by -1px so
 *    the crosshair center aligns exactly on the border intersection.
 *    Opacity is slightly higher than the grid lines (`white/30` vs
 *    `white/[0.06]`) so they read as deliberate design marks, not noise.
 *
 * 4. EDGE-TO-EDGE MODE
 *    When a BlockBorder lives inside a parent that already provides left/
 *    right borders (e.g. a full-width rail container), pass `border-x-0`
 *    via `className` and `crosses={false}` so the internal grid lines
 *    visually connect to the parent's outer borders instead of drawing
 *    their own.
 *
 * ─────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { BlockBorder } from "@/components/ui/block-border";
 *
 * // Standalone 3-column grid with crosshairs
 * <BlockBorder cols={3}>
 *   <div className="grid grid-cols-3">
 *     <div className="p-5">Cell 1</div>
 *     <div className="p-5">Cell 2</div>
 *     <div className="p-5">Cell 3</div>
 *   </div>
 * </BlockBorder>
 *
 * // 3-column, 2-row grid
 * <BlockBorder cols={3} rows={2}>
 *   <div className="grid grid-cols-3">
 *     {items.map(item => <div className="p-5" key={item.id}>{item.name}</div>)}
 *   </div>
 * </BlockBorder>
 *
 * // Edge-to-edge inside a railed parent (no side borders, no crosses)
 * <div className="max-w-5xl mx-auto border-x border-border">
 *   <BlockBorder cols={4} crosses={false} className="border-x-0">
 *     <div className="grid grid-cols-4">...</div>
 *   </BlockBorder>
 * </div>
 *
 * // Custom line color
 * <BlockBorder cols={2} lineColor="rgba(255,255,255,0.10)">
 *   ...
 * </BlockBorder>
 *
 * // Custom crosshair size and opacity
 * <BlockBorder cols={2} crossSize={24} crossOpacity={0.5}>
 *   ...
 * </BlockBorder>
 * ```
 *
 * ─────────────────────────────────────────────────────────────
 * PROPS
 * ─────────────────────────────────────────────────────────────
 *
 * | Prop           | Type            | Default                      | Description                                                  |
 * |----------------|-----------------|------------------------------|--------------------------------------------------------------|
 * | children       | ReactNode       | —                            | Content to render inside the bordered container              |
 * | cols           | number          | 1                            | Number of column divisions. 1 = no vertical grid lines       |
 * | rows           | number          | 1                            | Number of row divisions. 1 = no horizontal grid lines        |
 * | crosses        | boolean         | true                         | Show crosshair marks at all four corners                     |
 * | lineColor      | string          | "rgba(255,255,255,0.06)"     | CSS color for border and grid lines                          |
 * | crossSize      | number          | 18                           | Length of each crosshair arm in pixels                       |
 * | crossOpacity   | number          | 0.3                          | Opacity of crosshair marks (0–1)                             |
 * | className      | string          | ""                           | Additional classes on the outer container                    |
 * | as             | ElementType     | "div"                        | HTML element to render as                                    |
 */

import { type ElementType, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────

interface BlockBorderProps {
  children: ReactNode;
  /** Number of column divisions. 1 = no vertical grid lines. */
  cols?: number;
  /** Number of row divisions. 1 = no horizontal grid lines. */
  rows?: number;
  /** Show crosshair marks at all four corners. */
  crosses?: boolean;
  /** CSS color string for border and grid lines. */
  lineColor?: string;
  /** Length of each crosshair arm in pixels. */
  crossSize?: number;
  /** Opacity of crosshair marks (0–1). */
  crossOpacity?: number;
  /** Additional classes on the outer container. */
  className?: string;
  /** HTML element to render as. */
  as?: ElementType;
}

interface CrossMarkProps {
  /** Positioning class, e.g. "top-0 left-0" */
  position: string;
  /** Arm length in pixels */
  size: number;
  /** Opacity value (0–1) */
  opacity: number;
}

// ─── CrossMark ───────────────────────────────────────────────
//
// Renders a single crosshair: two 1px-thick divs crossing at
// 90 degrees, centered on a shared point. The horizontal arm
// is `size`px wide × 1px tall. The vertical arm is 1px wide ×
// `size`px tall. Both are absolutely centered within an
// `size × size` box, which is then positioned at a corner of
// the parent BlockBorder.

function CrossMark({ position, size, opacity }: CrossMarkProps) {
  return (
    <div
      className={`absolute pointer-events-none ${position}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Horizontal arm */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: size,
          height: 1,
          backgroundColor: `color-mix(in oklch, var(--foreground) ${opacity * 100}%, transparent)`,
        }}
      />
      {/* Vertical arm */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 1,
          height: size,
          backgroundColor: `color-mix(in oklch, var(--foreground) ${opacity * 100}%, transparent)`,
        }}
      />
    </div>
  );
}

// ─── Gradient builders ───────────────────────────────────────
//
// Each function returns a CSS `repeating-linear-gradient` string
// that draws 1px lines at evenly spaced intervals.
//
// Column gradient: repeats along the x-axis (90deg) so the 1px
// stripe appears as a vertical line at each column boundary.
//
// Row gradient: repeats along the y-axis (0deg) so the 1px
// stripe appears as a horizontal line at each row boundary.

function buildColGradient(cols: number, color: string): string | null {
  if (cols <= 1) return null;
  const pct = 100 / cols;
  return `repeating-linear-gradient(90deg, ${color} 0, ${color} 1px, transparent 1px, transparent ${pct}%)`;
}

function buildRowGradient(rows: number, color: string): string | null {
  if (rows <= 1) return null;
  const pct = 100 / rows;
  return `repeating-linear-gradient(0deg, ${color} 0, ${color} 1px, transparent 1px, transparent ${pct}%)`;
}

// ─── BlockBorder ─────────────────────────────────────────────

export function BlockBorder({
  children,
  cols = 1,
  rows = 1,
  crosses = true,
  lineColor = "var(--border)",
  crossSize = 18,
  crossOpacity = 0.3,
  className = "",
  as: Tag = "div",
}: BlockBorderProps) {
  // Build background gradients for the internal grid lines.
  // Multiple gradients are composited by joining with commas.
  const gradients = [
    buildColGradient(cols, lineColor),
    buildRowGradient(rows, lineColor),
  ]
    .filter(Boolean)
    .join(", ");

  // Crosshair offset: shift by half a pixel so the cross center
  // sits exactly on the border's 1px edge.
  const offset = -1;

  return (
    <Tag
      className={`relative overflow-hidden border ${className}`}
      style={{ borderColor: lineColor }}
    >
      {/* Grid overlay — hidden on mobile */}
      {gradients && (
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{ backgroundImage: gradients }}
          aria-hidden="true"
        />
      )}
      {children}

      {crosses && (
        <>
          <CrossMark
            position={`-top-[${offset}px] -left-[${offset}px]`}
            size={crossSize}
            opacity={crossOpacity}
          />
          <CrossMark
            position={`-top-[${offset}px] -right-[${offset}px]`}
            size={crossSize}
            opacity={crossOpacity}
          />
          <CrossMark
            position={`-bottom-[${offset}px] -left-[${offset}px]`}
            size={crossSize}
            opacity={crossOpacity}
          />
          <CrossMark
            position={`-bottom-[${offset}px] -right-[${offset}px]`}
            size={crossSize}
            opacity={crossOpacity}
          />
        </>
      )}
    </Tag>
  );
}

export default BlockBorder;
