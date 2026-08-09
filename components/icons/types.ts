import type { ComponentType, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/** Type of any component in this directory — for typing "an icon" generically
 *  (e.g. a config array's `icon` field), not for rendering a specific icon. */
export type IconComponent = ComponentType<IconProps>;
