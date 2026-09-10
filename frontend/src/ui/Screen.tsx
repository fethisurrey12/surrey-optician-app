import { LinearGradient } from "expo-linear-gradient";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { contentMaxWidth, pagePadding, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";

// Screen scaffold: full-bleed dark gradient background, a responsive centred
// column (full width on phones, 720/960/1080 on tablet/desktop), a sticky
// header, and a scroll area with correct safe-area padding. The tab bar sits
// in the layout flow beneath the scene, so content is never hidden under it.
export function Screen({
  children,
  header,
  scroll = true,
  tabBar = false,
  center = false,
  keyboardAware = false,
  bottomOffset = 24,
  contentStyle,
  padHorizontal,
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
  const { width } = useWindowDimensions();
  const pad = padHorizontal ?? pagePadding(width);
  const maxWidth = contentMaxWidth(width);

  // The tab bar is part of the layout (not floating), so it only needs the
  // gap between the last card and the bar; other screens add the home inset.
  const bottomPad = tabBar ? spacing.xl : insets.bottom + spacing.xl;

  const contentContainerStyle = [
    {
      paddingTop: header ? spacing.md : insets.top + spacing.md,
      paddingBottom: bottomPad,
      paddingHorizontal: pad,
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
      <View style={[styles.column, { maxWidth }]}>
        {header ? (
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingHorizontal: pad }]}>
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
                    tintColor={colors.teal}
                    colors={[colors.teal]}
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
                paddingBottom: bottomPad,
                paddingHorizontal: pad,
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
  root: { flex: 1, backgroundColor: colors.paper },
  column: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  flex: { flex: 1 },
  header: {
    paddingBottom: spacing.sm,
  },
}));
