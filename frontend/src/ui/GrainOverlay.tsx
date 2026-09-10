import { Image, StyleSheet, View } from "react-native";

// A fine grain across the whole app, barely there. It keeps large flat fields
// from banding on cheap screens. Rendered above content but ignores touches.
export function GrainOverlay({ opacity = 0.022 }: { opacity?: number }) {
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
