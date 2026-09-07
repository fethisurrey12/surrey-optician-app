import { BlurView } from "expo-blur";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "@/src/lib/motion";
import { radius, spacing } from "@/src/tokens";
import { makeStyles } from "@/src/theme";

// A sheet that slides up. Full-screen for the voucher; anchored-bottom card
// otherwise, over a dimmed, blurred backdrop.
export function Sheet({
  visible,
  onClose,
  children,
  fullScreen = false,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduce ? "none" : "slide"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          testID="sheet-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        {fullScreen ? (
          <View
            style={[
              styles.full,
              { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            {children}
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.grabber} />
            {children}
          </View>
        )}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  full: {
    flex: 1,
    backgroundColor: colors.deep,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.deep,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
}));
