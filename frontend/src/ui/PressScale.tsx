import { type ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/src/lib/motion";
import { tapLight } from "@/src/lib/haptics";

// A pressable whose contents scale down very slightly on press.
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
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        if (!reduce) scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        if (!reduce) scale.value = withTiming(1, { duration: 140 });
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
