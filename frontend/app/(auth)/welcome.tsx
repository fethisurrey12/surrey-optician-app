import { useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";

import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { BrandButton } from "@/src/ui/BrandButton";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { LogoMark } from "@/src/ui/LogoMark";
import { Wordmark } from "@/src/ui/Wordmark";

export default function Welcome() {
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // The logo tile, sized to the screen but never so large it crowds the copy.
  const mark = Math.max(74, Math.min(104, (width - 96) / 2.2));

  return (
    <Screen scroll={false} testID="welcome-screen">
      <View style={styles.body}>
        <View style={styles.hero}>
          <StaggerItem index={0}>
            {/* The practice's lockup: the tile above, the wordmark beneath. */}
            <View style={styles.lockup}>
              <LogoMark height={mark} />
              <Wordmark size={mark < 90 ? "md" : "lg"} />
            </View>
          </StaggerItem>
        </View>

        <View style={styles.copy}>
          <StaggerItem index={1}>
            <Txt variant="h1" style={styles.headline}>
              A quieter kind of reward
            </Txt>
          </StaggerItem>
          <StaggerItem index={2}>
            <Txt variant="body" style={styles.sentence}>
              Earn a point for every £10 you spend, and ten points become a £10 voucher for your
              next visit.
            </Txt>
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
  body: { flex: 1, justifyContent: "center", gap: spacing.huge },
  hero: { alignItems: "center" },
  lockup: { alignItems: "center", gap: spacing.base },
  copy: { gap: spacing.md },
  headline: { textAlign: "left" },
  sentence: { maxWidth: 340 },
  actions: { gap: spacing.base, paddingBottom: spacing.sm },
  note: { textAlign: "center" },
}));
