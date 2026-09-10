import { Linking, Platform, View } from "react-native";

import { BRANCHES, PRACTICE_EMAIL, type Branch } from "@/src/api/data";
import { spacing } from "@/src/tokens";
import { makeStyles, useTheme } from "@/src/theme";
import { Card } from "@/src/ui/Card";
import { BrandButton } from "@/src/ui/BrandButton";
import { GhostButton } from "@/src/ui/GhostButton";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { Icon } from "@/src/ui/Icon";
import { PressScale } from "@/src/ui/PressScale";
import { Screen } from "@/src/ui/Screen";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";
import { openBooking } from "@/src/lib/booking";

function openMaps(query: string) {
  const q = encodeURIComponent(query);
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${q}`,
    default: `https://www.google.com/maps/search/?api=1&query=${q}`,
  });
  Linking.openURL(url as string).catch(() => {});
}

function BranchCard({ branch, index }: { branch: Branch; index: number }) {
  const styles = useStyles();
  return (
    <StaggerItem index={index}>
      <Card contentStyle={styles.card} testID={`branch-card-${branch.id}`}>
        <Txt variant="h3">{branch.name}</Txt>
        <View style={styles.addr}>
          {branch.address.map((line) => (
            <Txt key={line} variant="body">
              {line}
            </Txt>
          ))}
        </View>

        <View style={styles.hours}>
          {branch.hours.map((h) => (
            <View key={h.days} style={styles.hoursRow}>
              <Txt variant="caption" tone="sage">
                {h.days}
              </Txt>
              <Txt variant="caption" tone="ink" tabular>
                {h.time}
              </Txt>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <GhostButton
            label={branch.phoneDisplay}
            icon="phone"
            onPress={() => Linking.openURL(`tel:${branch.phone}`).catch(() => {})}
            testID={`branch-call-${branch.id}`}
            style={styles.action}
          />
          <GhostButton
            label="Directions"
            icon="directions"
            onPress={() => openMaps(branch.mapQuery)}
            testID={`branch-directions-${branch.id}`}
            style={styles.action}
          />
        </View>
      </Card>
    </StaggerItem>
  );
}

export default function Branches() {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Screen header={<HeaderBar title="Branches" />} testID="branches-screen">
      <View style={styles.list}>
        <StaggerItem index={0}>
          <Card contentStyle={styles.bookCard}>
            <View style={styles.bookText}>
              <Txt variant="title" tone="ink">
                Book an appointment
              </Txt>
              <Txt variant="caption">
                Eye examinations and contact lens checks, at any branch.
              </Txt>
            </View>
            <BrandButton
              label="Book online"
              icon="calendar"
              onPress={() => void openBooking()}
              testID="branches-book-button"
            />
          </Card>
        </StaggerItem>

        {BRANCHES.map((b, i) => (
          <BranchCard key={b.id} branch={b} index={i + 1} />
        ))}

        <StaggerItem index={BRANCHES.length + 1}>
          <Card contentStyle={styles.emailCard}>
            <View style={styles.emailText}>
              <Txt variant="title" tone="ink">
                Email the practice
              </Txt>
              <Txt variant="caption">We reply within a working day.</Txt>
            </View>
            <PressScale
              onPress={() => Linking.openURL(`mailto:${PRACTICE_EMAIL}`).catch(() => {})}
              style={styles.mailBtn}
              testID="branches-email"
              accessibilityLabel="Email the practice"
            >
              <Icon name="mail" size={20} color={colors.paper} strokeWidth={2} />
            </PressScale>
          </Card>
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { gap: spacing.base, paddingTop: spacing.sm },
  bookCard: { gap: spacing.md, padding: spacing.lg },
  bookText: { gap: 4 },
  card: { gap: spacing.md, padding: spacing.lg },
  addr: { gap: 1 },
  hours: { gap: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.divider },
  hoursRow: { flexDirection: "row", justifyContent: "space-between" },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  action: { flex: 1 },
  emailCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  emailText: { gap: 2, flex: 1 },
  mailBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
}));
