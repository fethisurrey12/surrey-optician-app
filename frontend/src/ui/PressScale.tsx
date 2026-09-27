import { type ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/src/lib/motion";
import { tapLight } from "@/src/lib/haptics";

// A pressable whose contents dip under the finger: 0.95 on press, eased over
// 200ms, and a gentle dim on hover for the desk browser. Honoured everywhere
// a card or a button can be tapped, so the whole app answers the same way.
const EASE = Easing.inOut(Easing.ease);

export function PressScale({
  children,
  onPress,
  style,
  disabled,
  hitSlop = 8,
  haptic = true,
  testID,
  accessibilityLabel,
  accessibilityRole = "button",
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  hitSlop?: number;
  haptic?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link" | "none";
}) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);
  // .get()/.set() rather than .value: mutating .value reads as mutating a
  // React-owned binding, which the compiler-era lint rules reject.
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }], opacity: dim.get() }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      onHoverIn={() => {
        dim.set(withTiming(0.88, { duration: 150 }));
      }}
      onHoverOut={() => {
        dim.set(withTiming(1, { duration: 200 }));
      }}
      onPressIn={() => {
        if (!reduce) scale.set(withTiming(0.95, { duration: 200, easing: EASE }));
      }}
      onPressOut={() => {
        if (!reduce) scale.set(withTiming(1, { duration: 200, easing: EASE }));
      }}
      onPress={() => {
        if (disabled) return;
        if (haptic) tapLight();
        onPress?.();
      }}
    >
      <Animated.View style={[animStyle, style, disabled ? { opacity: 0.5 } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
