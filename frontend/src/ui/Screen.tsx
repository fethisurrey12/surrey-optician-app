import { LinearGradient } from "expo-linear-gradient";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAX_WIDTH, spacing, TAB_BAR_HEIGHT } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Screen scaffold: full-bleed dark gradient background, a centred 480px column
// on wide screens, a sticky header, and a scroll area with correct safe-area
// and tab-bar padding.
export function Screen({
  children,
  header,
  scroll = true,
  tabBar = false,
  center = false,
  keyboardAware = false,
  bottomOffset = 24,
  contentStyle,
  padHorizontal = spacing.lg,
  onRefresh,
  refreshing,
  testID,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  tabBar?: boolean;
  center?: boolean;
  keyboardAware?: boolean;
  bottomOffset?: number;
  contentStyle?: StyleProp<ViewStyle>;
  padHorizontal?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPad = (tabBar ? TAB_BAR_HEIGHT : 0) + insets.bottom + spacing.xl;

  const contentContainerStyle = [
    {
      paddingTop: header ? spacing.md : insets.top + spacing.md,
      paddingBottom: bottomPad,
      paddingHorizontal: padHorizontal,
    },
    contentStyle,
  ];

  return (
    <View style={styles.root} testID={testID}>
      <LinearGradient
        colors={colors.screenGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.column}>
        {header ? (
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingHorizontal: padHorizontal }]}>
            {header}
          </View>
        ) : null}

        {scroll ? (
          keyboardAware ? (
            <KeyboardAwareScrollView
              style={styles.flex}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bottomOffset={bottomOffset}
              contentContainerStyle={contentContainerStyle}
            >
              {children}
            </KeyboardAwareScrollView>
          ) : (
            <ScrollView
              style={styles.flex}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={contentContainerStyle}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={!!refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.gold}
                    colors={[colors.gold]}
                  />
                ) : undefined
              }
            >
              {children}
            </ScrollView>
          )
        ) : (
          <View
            style={[
              styles.flex,
              {
                paddingTop: header ? spacing.md : insets.top + spacing.md,
                paddingBottom: insets.bottom + spacing.xl,
                paddingHorizontal: padHorizontal,
                justifyContent: center ? "center" : "flex-start",
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.ink },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
    ...Platform.select({
      web: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.divider,
      },
      default: {},
    }),
  },
  flex: { flex: 1 },
  header: {
    paddingBottom: spacing.sm,
  },
}));
