import type { ThemeIconName } from "@/config/theme";
import { ThemeEntityAvatar } from "@/components/admin-form";

interface WalletAvatarProps {
  icon: ThemeIconName;
  color: string;
  size?: "sm" | "md";
}

export function WalletAvatar(props: WalletAvatarProps) {
  return <ThemeEntityAvatar {...props} />;
}
