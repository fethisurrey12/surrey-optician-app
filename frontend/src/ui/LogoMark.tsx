import { Image, type ImageStyle } from "expo-image";
import { type StyleProp } from "react-native";



// The practice's logo tile, as it appears on surreyopticians.co.uk.
//
// It is one image file — assets/images/logo-mark.png — so replacing it with
// the practice's real artwork needs no code change beyond ASPECT below if the
// new file has different proportions. The current file is a stand-in drawn by
// scripts/make-brand-assets.py.
const ASPECT = 880 / 400;

export function LogoMark({
  height = 34,
  style,
}: {
  /** Width follows from the tile's proportions. */
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require("../../assets/images/logo-mark.png")}
      style={[
        { height, width: Math.round(height * ASPECT), borderRadius: 4 },
        style,
      ]}
      contentFit="contain"
      accessibilityLabel="Surrey Opticians"
    />
  );
}
