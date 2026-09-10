import { BlurView } from "expo-blur";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVouchers } from "@/src/api/hooks";
import { FoilBadge } from "@/src/ui/FoilBadge";
import { Icon, type IconName } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { contentMaxWidth, TAB_BAR_HEIGHT } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Minimal shape of the props expo-router passes to a custom tabBar.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: "tabPress"; target?: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "rewards", label: "Rewards", icon: "gift" },
  { name: "activity", label: "Activity", icon: "activity" },
  { name: "account", label: "Account", icon: "user" },
];

// Blurred translucent tab bar with a gold indicator above the active tab and a
// foil badge on Rewards showing how many are waiting.
export function TabBar({ state, navigation }: TabBarProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: vouchers } = useVouchers();
  const waiting = (vouchers ?? []).filter((v) => v.status === "available").length;

  return (
    <View style={[styles.wrap, { height: TAB_BAR_HEIGHT + insets.bottom }]}>
      <BlurView intensity={36} tint="dark" style={styles.blur}>
        <View style={[styles.row, { paddingBottom: insets.bottom, maxWidth: Math.min(contentMaxWidth(width), 720) }]}>
          {TABS.map((tab) => {
            const index = state.routes.findIndex((r) => r.name === tab.name);
            const focused = state.index === index;
            const color = focused ? colors.gold : colors.dimSage;

            return (
              <View key={tab.name} style={styles.item}>
                <PressScale
                  style={styles.press}
                  haptic={false}
                  accessibilityLabel={tab.label}
                  testID={`tab-${tab.name === "index" ? "home" : tab.name}`}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: state.routes[index]?.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
                  }}
                >
                  <View style={styles.itemInner}>
                    <View style={[styles.indicator, focused && styles.indicatorOn]} />
                    <View>
                      <Icon name={tab.icon} size={23} color={color} strokeWidth={focused ? 2 : 1.7} />
                      {tab.name === "rewards" && waiting > 0 ? (
                        <View style={styles.badge}>
                          <FoilBadge count={waiting} testID="rewards-tab-badge" />
                        </View>
                      ) : null}
                    </View>
                    <Txt style={[styles.label, { color }]} numberOfLines={1}>
                      {tab.label}
                    </Txt>
                  </View>
                </PressScale>
              </View>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { width: "100%" },
  blur: {
    flex: 1,
    backgroundColor: colors.glass,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: { flex: 1, flexDirection: "row", width: "100%", alignSelf: "center" },
  item: { flex: 1, minWidth: 0, height: TAB_BAR_HEIGHT },
  press: { height: TAB_BAR_HEIGHT },
  itemInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 2 },
  indicator: {
    position: "absolute",
    top: 0,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  indicatorOn: { backgroundColor: colors.gold },
  badge: { position: "absolute", top: -6, right: -10 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: "600", letterSpacing: 0.2, textAlign: "center" },
}));
