import { useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";

import { spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";
import { BrandButton } from "@/src/ui/BrandButton";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { Wordmark } from "@/src/ui/Wordmark";

export default function Welcome() {
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lens = Math.max(200, Math.min(260, width - 80));

  return (
    <Screen scroll={false} testID="welcome-screen">
      <View style={styles.body}>
        <View style={styles.hero}>
          <StaggerItem index={0}>
            <View style={[styles.lens, { width: lens, height: lens, borderRadius: lens / 2 }]}>
              <View style={[styles.lensInner, { width: lens - 50, height: lens - 50, borderRadius: (lens - 50) / 2 }]} />
              <Wordmark size={lens < 240 ? "md" : "lg"} />
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
  lens: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  lensInner: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: { gap: spacing.md },
  headline: { textAlign: "left" },
  sentence: { maxWidth: 340 },
  actions: { gap: spacing.base, paddingBottom: spacing.sm },
  note: { textAlign: "center" },
}));
