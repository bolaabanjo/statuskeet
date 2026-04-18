const sizes = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-6 h-6 text-[11px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
} as const;

const variants = {
  green: "bg-green-500/20 text-green-400",
  blue: "bg-blue-500/20 text-blue-400",
  purple: "bg-purple-500/20 text-purple-400",
  orange: "bg-orange-500/20 text-orange-400",
  red: "bg-red-500/20 text-red-400",
  muted: "bg-white/[0.06] text-muted-foreground",
} as const;

export function Avatar({
  name,
  src,
  size = "sm",
  variant = "green",
  className = "",
}: {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-none object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${variants[variant]} rounded-none border border-border/10 flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
