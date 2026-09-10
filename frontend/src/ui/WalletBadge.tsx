import { ActivityIndicator, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { type WalletProvider } from "@/src/api/data";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Txt } from "@/src/ui/Txt";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";

// "Add to Apple Wallet" / "Add to Google Wallet" badge buttons. Both platforms
// mandate a black badge with a white label, so these literals are brand colours
// and deliberately not themed.
const BADGE_BLACK = "#000000";
const BADGE_WHITE = "#FFFFFF";
const BADGE_BORDER = "#A6A6A6";
const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC04";
const G_GREEN = "#34A853";

function AppleWalletGlyph() {
  return (
    <Svg width={26} height={22} viewBox="0 0 26 22">
      <Rect x="1" y="1" width="24" height="20" rx="4" fill="#3A3A3C" />
      <Rect x="1" y="1" width="24" height="6" rx="3" fill="#F5B300" />
      <Rect x="1" y="5" width="24" height="5" fill="#FF3B30" />
      <Rect x="1" y="9" width="24" height="5" fill="#34C759" />
      <Rect x="1" y="12" width="24" height="9" rx="3" fill="#0A84FF" />
      <Path d="M1 14h24v3a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4z" fill="#1C1C1E" />
    </Svg>
  );
}

function GoogleWalletGlyph() {
  return (
    <Svg width={26} height={22} viewBox="0 0 26 22">
      <Path d="M3 6.5C3 4 5 2 7.5 2h11C21 2 23 4 23 6.5V8H3z" fill={G_BLUE} />
      <Path d="M3 8h20v4.5H3z" fill={G_RED} />
      <Path d="M3 12.5h20v3.5H3z" fill={G_YELLOW} />
      <Path d="M3 16h20v.5C23 19 21 21 18.5 21h-11C5 21 3 19 3 16.5z" fill={G_GREEN} />
    </Svg>
  );
}

export function WalletBadge({
  provider,
  added,
  loading,
  onPress,
  testID,
}: {
  provider: WalletProvider;
  added?: boolean;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const styles = useStyles();
  const brand = provider === "apple" ? "Apple Wallet" : "Google Wallet";
  const label = added ? `Added to ${brand}` : `Add to ${brand}`;
  return (
    <PressScale onPress={onPress} disabled={loading} testID={testID} accessibilityLabel={label}>
      <View style={styles.badge}>
        {loading ? (
          <ActivityIndicator color={BADGE_WHITE} />
        ) : (
          <>
            {added ? (
              <Icon name="check" size={20} color={BADGE_WHITE} strokeWidth={2.2} />
            ) : provider === "apple" ? (
              <AppleWalletGlyph />
            ) : (
              <GoogleWalletGlyph />
            )}
            <Txt variant="bodyStrong" style={styles.label}>
              {label}
            </Txt>
          </>
        )}
      </View>
    </PressScale>
  );
}

const useStyles = makeStyles(() => ({
  badge: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: BADGE_BLACK,
    borderWidth: 1,
    borderColor: BADGE_BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  label: { color: BADGE_WHITE, textAlign: "center" },
}));
