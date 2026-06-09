import { ThemeIcon, type ThemeIconName } from "@/config/theme";

interface ThemeEntityAvatarProps {
  icon: ThemeIconName;
  color: string;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-10 w-10 rounded-xl",
} as const;

export function ThemeEntityAvatar({
  icon,
  color,
  size = "md",
}: ThemeEntityAvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${sizeClasses[size]}`}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
    >
      <ThemeIcon name={icon} size={size === "sm" ? "sm" : "md"} />
    </span>
  );
}
