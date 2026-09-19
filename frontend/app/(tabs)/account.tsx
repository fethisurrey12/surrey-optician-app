import { useRouter } from "expo-router";
import { View } from "react-native";

import { branchName } from "@/src/api/data";
import { useAccount } from "@/src/api/hooks";
import { dayMonthYear } from "@/src/lib/points";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { Divider } from "@/src/ui/Divider";
import { Icon } from "@/src/ui/Icon";
import { Row } from "@/src/ui/Row";
import { Screen } from "@/src/ui/Screen";
import { SkeletonCard } from "@/src/ui/Skeleton";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { Wordmark } from "@/src/ui/Wordmark";

export default function Account() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { data: a } = useAccount();

  if (!a) {
    return (
      <Screen tabBar testID="account-screen" header={<Txt variant="h1">Account</Txt>}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} style={styles.block} />
      </Screen>
    );
  }

  return (
    <Screen tabBar testID="account-screen" header={<Txt variant="h1">Account</Txt>}>
      <StaggerItem index={0}>
        <Card contentStyle={styles.member} testID="membership-card">
          <View pointerEvents="none" style={styles.lens} />
          <View style={styles.memberTop}>
            <Wordmark size="sm" align="left" />
            <Txt variant="label" tone="teal">
              Member
            </Txt>
          </View>
          <Txt variant="h2" style={styles.name}>
            {a.firstName} {a.lastName}
          </Txt>
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Txt variant="caption" tone="dimSage">
                Mobile
              </Txt>
              <Txt variant="bodyStrong" tone="ink" tabular>
                {a.mobileDisplay}
              </Txt>
            </View>
            <View style={styles.meta}>
              <Txt variant="caption" tone="dimSage">
                Member since
              </Txt>
              <Txt variant="bodyStrong" tone="ink">
                {dayMonthYear(a.memberSince)}
              </Txt>
            </View>
          </View>
          <Txt variant="caption" tone="sage" style={styles.branch}>
            Home branch · {branchName(a.homeBranchId)}
          </Txt>
        </Card>
      </StaggerItem>

      <StaggerItem index={1} style={styles.block}>
        <Card contentStyle={styles.links}>
          <Row icon="user" title="Your details" subtitle="Name, email and home branch" onPress={() => router.push("/details")} testID="link-details" />
          <Divider inset={54} />
          <Row icon="users" title="Refer a friend" subtitle={`Your code · ${a.referralCode}`} onPress={() => router.push("/refer")} testID="link-refer" />
          <Divider inset={54} />
          <Row icon="pin" title="Branches and contact" subtitle="Coulsdon, Wallington, Banstead" onPress={() => router.push("/branches")} testID="link-branches" />
          <Divider inset={54} />
          <Row icon="sliders" title="Settings" subtitle="Unlock, notifications and terms" onPress={() => router.push("/settings")} testID="link-settings" />
        </Card>
      </StaggerItem>

      <StaggerItem index={2} style={styles.block}>
        <Card contentStyle={styles.privacy} testID="privacy-note">
          <View style={styles.privacyHead}>
            <Icon name="shield" size={18} color={colors.sage} />
            <Txt variant="title" tone="ink">
              Loyalty data only
            </Txt>
          </View>
          <Txt variant="body">
            This app holds your name, mobile number, email, points and preferences. It cannot see
            your prescription, appointments or any clinical records. Reminders, such as your
            eye-test recall, are worked out from your purchase history alone.
          </Txt>
        </Card>
      </StaggerItem>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  member: { padding: spacing.lg, gap: spacing.base, overflow: "hidden" },
  lens: {
    position: "absolute",
    right: -70,
    top: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.accentBorderSoft,
  },
  memberTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  name: { marginTop: spacing.sm },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, rowGap: spacing.md, marginTop: spacing.xs },
  meta: { gap: 2 },
  branch: { marginTop: spacing.xs },
  block: { marginTop: spacing.lg },
  links: { paddingVertical: 0, paddingHorizontal: spacing.base },
  privacy: { gap: spacing.md, padding: spacing.lg },
  privacyHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}));
