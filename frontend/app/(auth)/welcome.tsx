import { useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";

import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { BrandButton } from "@/src/ui/BrandButton";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { LOGO_ASPECT, LogoMark } from "@/src/ui/LogoMark";

export default function Welcome() {
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // The logo tile, sized from the screen's width by its own proportions so it
  // never runs past the page's margins.
  const mark = Math.max(40, Math.min(96, (width - 96) / LOGO_ASPECT));

  return (
    <Screen scroll={false} testID="welcome-screen">
      <View style={styles.body}>
        <View style={styles.hero}>
          <StaggerItem index={0}>
            {/* The practice's lockup, which carries the wordmark itself. */}
            <View style={styles.lockup}>
              <LogoMark height={mark} />
            </View>
          </StaggerItem>
        </View>

      </View>

      <StaggerItem index={3} style={styles.actions}>
        <BrandButton
          label="Sign in"
          onPress={() => router.push("/(auth)/phone")}
          testID="welcome-signin-button"
        />
        <Txt variant="caption" style={styles.note}>
          Sign in with your mobile number to start collecting.
        </Txt>
      </StaggerItem>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { flex: 1, justifyContent: "center" },
  hero: { alignItems: "center" },
  lockup: { alignItems: "center", gap: spacing.base },
  actions: { gap: spacing.base, paddingBottom: spacing.sm },
  note: { textAlign: "center" },
}));
