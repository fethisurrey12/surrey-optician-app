import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Share, View } from "react-native";

import { REFERRAL_BONUS_POINTS, REFERRAL_LINK_BASE, type Referral } from "@/src/api/data";
import { useAccount, useReferrals } from "@/src/api/hooks";
import { useApp } from "@/src/context/AppContext";
import { dayMonthYear } from "@/src/lib/points";
import { font, radius, spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { Divider } from "@/src/ui/Divider";
import { GhostButton } from "@/src/ui/GhostButton";
import { GoldButton } from "@/src/ui/GoldButton";
import { GradientText } from "@/src/ui/GradientText";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Icon } from "@/src/ui/Icon";
import { Screen } from "@/src/ui/Screen";
import { SectionHeader } from "@/src/ui/SectionHeader";
import { SkeletonCard, SkeletonRow } from "@/src/ui/Skeleton";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

const STATUS: Record<Referral["status"], { label: string; tone: "gold" | "sage" | "dimSage" }> = {
  rewarded: { label: "Point earned", tone: "gold" },
  joined: { label: "Joined · first visit pending", tone: "sage" },
  invited: { label: "Invite sent", tone: "dimSage" },
};

export default function Refer() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { toast } = useApp();
  const { data: a } = useAccount();
  const referrals = useReferrals();

  if (!a) {
    return (
      <Screen header={<HeaderBar title="Refer a friend" />} testID="refer-screen">
        <SkeletonCard lines={3} />
      </Screen>
    );
  }

  const link = `${REFERRAL_LINK_BASE}?ref=${a.referralCode}`;
  const message =
    `${a.firstName} has invited you to Surrey Opticians. Quote ${a.referralCode} at your first visit ` +
    `(Coulsdon, Wallington or Banstead) and you’ll both earn a loyalty point. ${link}`;

  const onShare = async () => {
    try {
      await Share.share({ message, url: link, title: "Join Surrey Opticians" });
    } catch {
      toast("Couldn’t open the share sheet");
    }
  };

  const onCopy = async () => {
    await Clipboard.setStringAsync(a.referralCode);
    toast("Code copied");
  };

  const earned = (referrals.data ?? []).filter((r) => r.status === "rewarded").length;

  return (
    <Screen header={<HeaderBar title="Refer a friend" />} testID="refer-screen">
      <StaggerItem index={0}>
        <Card contentStyle={styles.hero} testID="refer-hero">
          <LinearGradient colors={colors.cardGradient} style={styles.fill} />
          <View style={styles.heroIcon}>
            <Icon name="users" size={22} color={colors.gold} />
          </View>
          <Txt variant="h2" style={styles.center}>
            Share the practice you trust
          </Txt>
          <Txt variant="body" style={styles.center}>
            When a friend quotes your code on their first private purchase, you both earn{" "}
            {REFERRAL_BONUS_POINTS === 1 ? "a bonus point" : `${REFERRAL_BONUS_POINTS} bonus points`}.
          </Txt>

          <View style={styles.codeBlock}>
            <Txt variant="label" tone="gold">
              Your code
            </Txt>
            <GradientText style={styles.code} tabular>
              {a.referralCode}
            </GradientText>
          </View>

          <GoldButton label="Share your invite" icon="share" onPress={onShare} testID="refer-share-button" />
          <GhostButton label="Copy code" icon="copy" onPress={onCopy} testID="refer-copy-button" />
        </Card>
      </StaggerItem>

      <StaggerItem index={1} style={styles.block}>
        <SectionHeader title="How it works" />
        <Card contentStyle={styles.steps}>
          {[
            ["Share", "Send your code or link to a friend."],
            ["They visit", "Your friend quotes the code at their first private purchase."],
            ["You both earn", "A bonus point lands on each account the same day."],
          ].map(([title, body], i) => (
            <View key={title} style={styles.step}>
              <View style={styles.stepNum}>
                <Txt variant="label" tone="ink">
                  {i + 1}
                </Txt>
              </View>
              <View style={styles.stepTexts}>
                <Txt variant="bodyStrong" tone="cream">
                  {title}
                </Txt>
                <Txt variant="caption">{body}</Txt>
              </View>
            </View>
          ))}
        </Card>
      </StaggerItem>

      <StaggerItem index={2} style={styles.block}>
        <SectionHeader title="Your invites" actionLabel={earned ? `${earned} earned` : undefined} />
        <Card contentStyle={styles.list}>
          {!referrals.data ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : referrals.data.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Txt variant="bodyStrong" tone="cream" style={styles.center}>
                No invites yet
              </Txt>
              <Txt variant="body" style={styles.center}>
                Share your code to get started.
              </Txt>
            </View>
          ) : (
            referrals.data.map((r, i) => (
              <View key={r.id}>
                <View style={styles.row} testID={`referral-${r.id}`}>
                  <View style={styles.rowTexts}>
                    <Txt variant="bodyStrong" tone="cream">
                      {r.friendName}
                    </Txt>
                    <Txt variant="caption">
                      {r.status === "rewarded" && r.rewardedAt
                        ? `Rewarded ${dayMonthYear(r.rewardedAt)}`
                        : `Invited ${dayMonthYear(r.invited)}`}
                    </Txt>
                  </View>
                  <Txt variant="label" tone={STATUS[r.status].tone}>
                    {STATUS[r.status].label}
                  </Txt>
                </View>
                {i < referrals.data!.length - 1 ? <Divider /> : null}
              </View>
            ))
          )}
        </Card>
      </StaggerItem>

      <Txt variant="caption" tone="dimSage" style={styles.terms}>
        Bonus points count towards your next £10 reward like any other point. One bonus per new
        member; the friend must not already hold a loyalty account.
      </Txt>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  hero: { alignItems: "center", gap: spacing.base, padding: spacing.xl, overflow: "hidden" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { textAlign: "center" },
  codeBlock: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
    marginTop: spacing.xs,
  },
  code: { fontFamily: font.serifLight, fontSize: 30, letterSpacing: 2, lineHeight: 36 },
  block: { marginTop: spacing.xl },
  steps: { gap: spacing.base, padding: spacing.lg },
  step: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepTexts: { flex: 1, gap: 2 },
  list: { paddingVertical: spacing.xs, paddingHorizontal: spacing.lg },
  emptyWrap: { paddingVertical: spacing.lg, gap: spacing.xs, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  rowTexts: { flex: 1, gap: 2 },
  terms: { marginTop: spacing.xl, textAlign: "center" },
}));
