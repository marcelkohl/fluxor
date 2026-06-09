import type { CSSProperties } from "react";
import { getThemeIconSvg, type ThemeIconName } from "./icon.registry";

export type ThemeIconSize = "sm" | "md" | "lg";

const sizeClasses: Record<ThemeIconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

interface ThemeIconProps {
  name: ThemeIconName;
  className?: string;
  size?: ThemeIconSize;
  style?: CSSProperties;
}

function injectSvgSize(svg: string): string {
  return svg.replace(
    /<svg\b/,
    '<svg width="100%" height="100%"',
  );
}

export function ThemeIcon({
  name,
  className = "",
  size = "md",
  style,
}: ThemeIconProps) {
  const svg = getThemeIconSvg(name);

  if (!svg) {
    if (import.meta.env.DEV) {
      console.warn(`[ThemeIcon] Ícone desconhecido: "${name}"`);
    }
    return null;
  }

  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`.trim()}
      style={style}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: injectSvgSize(svg) }}
    />
  );
}
