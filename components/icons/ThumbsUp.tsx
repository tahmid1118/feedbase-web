import type { IconProps } from "./types";

export function ThumbsUp({ size = 24, strokeWidth = 2, ...props }: IconProps) {
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
      <rect x="3" y="11" width="5" height="10" rx="1.5" />
      <path d="M8 21H16.5C17.5 21 18.3 20.3 18.5 19.3L20 12.3C20.2 11.1 19.3 10 18.1 10H13.5L14 5.5C14.1 4.4 13.3 3.5 12.3 3.3C11.9 3.2 11.5 3.4 11.3 3.8L8 10" />
    </svg>
  );
}
