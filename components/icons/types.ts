import type { ComponentType, SVGProps } from "react";

/**
 * Shared prop contract for every icon in components/icons/ — matches
 * lucide-react's icon component API (size, className, strokeWidth, and any
 * other standard SVG prop) so call sites don't change shape when swapping
 * icon sets. See ATTRIBUTION.md for the source of these icons.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/** Type of any component in this directory — for typing "an icon" generically
 *  (e.g. a config array's `icon` field), not for rendering a specific icon. */
export type IconComponent = ComponentType<IconProps>;
