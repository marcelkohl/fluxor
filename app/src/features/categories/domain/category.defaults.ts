import { isKnownIcon, type ThemeIconName } from "@/config/theme/icon.registry";
import {
  themeColorPalette,
  type ThemePaletteColor,
} from "@/config/theme/theme.palette";

/** Defaults para CreateCategoryQuick — primeiro ícone/cor da lista controlada. */
export const CATEGORY_QUICK_DEFAULT_ICON: ThemeIconName = "categoryServices";
export const CATEGORY_QUICK_DEFAULT_COLOR: ThemePaletteColor =
  themeColorPalette[0];

export function isControlledCategoryIcon(
  icon: string,
): icon is ThemeIconName {
  return isKnownIcon(icon);
}

export { themeColorPalette as categoryColorPalette };
