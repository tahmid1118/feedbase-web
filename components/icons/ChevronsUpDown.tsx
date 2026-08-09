import type { IconProps } from "./types";

export function ChevronsUpDown({ size = 24, strokeWidth = 2, ...props }: IconProps) {
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
      <path d="M7 10L12 5L17 10" />
      <path d="M7 14L12 19L17 14" />
    </svg>
  );
}
