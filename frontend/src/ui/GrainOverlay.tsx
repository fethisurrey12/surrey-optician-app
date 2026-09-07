import { Image, StyleSheet, View } from "react-native";

// A fine grain across the whole app at very low opacity, so large dark areas
// are never flat. Rendered above content but ignores touches.
export function GrainOverlay({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        source={require("../../assets/images/grain.png")}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
