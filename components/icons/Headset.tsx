import type { IconProps } from "./types";

export function Headset({ size = 24, strokeWidth = 2, ...props }: IconProps) {
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
      <path d="M4 13V11A8 8 0 0 1 20 11V13" />
      <rect x="2" y="13" width="4" height="6" rx="2" />
      <rect x="18" y="13" width="4" height="6" rx="2" />
    </svg>
  );
}
