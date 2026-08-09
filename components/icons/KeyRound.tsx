import type { IconProps } from "./types";

export function KeyRound({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="7" cy="7" r="4" />
      <line x1="10" y1="10" x2="20" y2="20" />
      <line x1="14" y1="14" x2="15.5" y2="12.5" />
      <line x1="17" y1="17" x2="18.5" y2="15.5" />
    </svg>
  );
}
