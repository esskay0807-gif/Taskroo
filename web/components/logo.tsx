import { cn } from "@/lib/utils";

const TEAL = "#12A594";

/** Taskroo logo. `markOnly` renders just the icon tile. The wordmark "Task" uses
 *  currentColor so it adapts to the surrounding text color; "roo" stays brand teal. */
export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  if (markOnly) {
    return (
      <svg
        viewBox="0 0 48 48"
        className={cn("h-8 w-8", className)}
        role="img"
        aria-label="Taskroo"
      >
        <rect width="48" height="48" rx="13" fill={TEAL} />
        <path
          d="M13.5 25.5 L21 33 L35 16.5"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="35" cy="16.5" r="3.1" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 208 48"
      className={cn("h-8 w-auto", className)}
      role="img"
      aria-label="Taskroo"
    >
      <rect width="48" height="48" rx="13" fill={TEAL} />
      <path
        d="M13.5 25.5 L21 33 L35 16.5"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="16.5" r="3.1" fill="#FFFFFF" />
      <text
        x="60"
        y="34"
        fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-0.6"
      >
        <tspan fill="currentColor">Task</tspan>
        <tspan fill={TEAL}>roo</tspan>
      </text>
    </svg>
  );
}
