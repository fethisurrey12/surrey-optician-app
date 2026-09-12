import { Image } from "expo-image";
import { Image as RNImage, type StyleProp, View, type ViewStyle } from "react-native";

// The practice's logo, from the artwork file rather than drawn in code.
//
// It renders assets/images/logo-mark.png, which is the one place the logo
// lives: replace that file with the practice's own artwork and every screen
// that shows the logo follows, with no code to edit. The store icon, splash and
// favicon are rendered from the same file by scripts/install-logo.mjs.
const SOURCE = require("../../assets/images/logo-mark.png");

// Fall back to the tile's proportions if the bundler cannot report the file's
// own size, so the logo is never laid out as a zero-width box.
const FALLBACK_ASPECT = 1032 / 400;

function aspectOf(source: number): number {
  try {
    const resolved = RNImage.resolveAssetSource(source);
    if (resolved?.width && resolved?.height) return resolved.width / resolved.height;
  } catch {
    // Web export paths where the asset registry is not available.
  }
  return FALLBACK_ASPECT;
}

export const LOGO_ASPECT = aspectOf(SOURCE);

export function LogoMark({
  height = 34,
  style,
}: {
  /** Width follows from the artwork's own proportions. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Surrey Opticians">
      <Image
        source={SOURCE}
        style={{ height, aspectRatio: LOGO_ASPECT }}
        contentFit="contain"
        // The logo is decoration around a label the screen reader already has.
        accessible={false}
      />
    </View>
  );
}
