import Animated, { FadeInDown } from "react-native-reanimated";
import { type StyleProp, type ViewStyle } from "react-native";

import { useReduceMotion } from "@/src/lib/motion";
import { DURATION } from "@/src/tokens";

// Staggered entrance for a screen's contents. Disabled under reduce-motion.
export function StaggerItem({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      entering={
        reduce
          ? undefined
          : FadeInDown.duration(DURATION.screen)
              .delay(index * DURATION.stagger)
              .springify()
              .damping(18)
      }
      style={style}
    >
      {children}
    </Animated.View>
  );
}
