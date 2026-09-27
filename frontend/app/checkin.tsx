import { View } from "react-native";

import { useAccount } from "@/src/api/hooks";
import { branchName } from "@/src/api/data";
import { makeStyles } from "@/src/theme";
import { spacing } from "@/src/tokens";
import { HeaderBar } from "@/src/ui/HeaderBar";
import { QRCode } from "@/src/ui/QRCode";
import { Screen } from "@/src/ui/Screen";
import { Skeleton } from "@/src/ui/Skeleton";
import { StaggerItem } from "@/src/ui/Stagger";
import { Txt } from "@/src/ui/Txt";

// The patient's membership QR, big enough to be read across a desk. A
// colleague scans it when they arrive for an appointment; it identifies them
// and records the arrival. It carries no clinical data and no points move.
export default function CheckIn() {
  const styles = useStyles();
  const { data: a } = useAccount();

  if (!a) {
    return (
      <Screen header={<HeaderBar title="Check in" />} testID="checkin-screen">
        <View style={styles.body}>
          <Skeleton height={260} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<HeaderBar title="Check in" />} testID="checkin-screen">
      <View style={styles.body}>
        <StaggerItem index={0}>
          <Txt variant="label" tone="teal" style={styles.center}>
            Show this at the desk
          </Txt>
        </StaggerItem>

        <StaggerItem index={1}>
          <View style={styles.plate} testID="checkin-qr">
            <QRCode code={a.memberCode} size={240} />
          </View>
        </StaggerItem>

        <StaggerItem index={2}>
          <Txt variant="h2" style={styles.center}>
            {a.firstName} {a.lastName}
          </Txt>
          <Txt variant="h3" tabular tone="ink" style={[styles.center, styles.code]}>
            {a.memberCode}
          </Txt>
          <Txt variant="caption" tone="sage" style={styles.center}>
            Home branch · {branchName(a.homeBranchId)}
          </Txt>
        </StaggerItem>

        <StaggerItem index={3}>
          <Txt variant="caption" style={[styles.center, styles.note]}>
            The same code every visit — a colleague scans it when you arrive. It shows the
            practice who you are and that you have arrived. It holds no clinical information.
          </Txt>
        </StaggerItem>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  body: { gap: spacing.lg, paddingTop: spacing.md, alignItems: "stretch" },
  center: { textAlign: "center" },
  plate: {
    alignSelf: "center",
    padding: spacing.base,
    borderRadius: 24,
    backgroundColor: colors.paper,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  code: { letterSpacing: 2, marginTop: 2 },
  note: { paddingHorizontal: spacing.md },
}));
