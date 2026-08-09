import type { IconProps } from "./types";

export function Bug({ size = 24, strokeWidth = 2, ...props }: IconProps) {
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
      <ellipse cx="12" cy="14" rx="4" ry="6" />
      <circle cx="12" cy="7" r="2" />
      <line x1="12" y1="10" x2="12" y2="19" />
      <line x1="8" y1="12" x2="4" y2="10" />
      <line x1="8" y1="14" x2="3" y2="14" />
      <line x1="8" y1="17" x2="4" y2="19" />
      <line x1="16" y1="12" x2="20" y2="10" />
      <line x1="16" y1="14" x2="21" y2="14" />
      <line x1="16" y1="17" x2="20" y2="19" />
      <line x1="10.5" y1="5.5" x2="8.5" y2="2.5" />
      <line x1="13.5" y1="5.5" x2="15.5" y2="2.5" />
    </svg>
  );
}
