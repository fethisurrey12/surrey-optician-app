// Booking an appointment.
//
// The practice takes bookings on its own website, so the app hands the patient
// straight to that page rather than keeping a separate diary. On a phone it
// opens in an in-app browser, which keeps the app in the back stack; on web it
// opens a new tab.

import { Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";

export const BOOKING_URL = "https://www.surreyopticians.co.uk/book-appointment";

export async function openBooking(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await Linking.openURL(BOOKING_URL);
      return;
    }
    await WebBrowser.openBrowserAsync(BOOKING_URL, {
      // Sit the browser chrome in the practice's colours rather than the
      // system default, so the hand-off does not feel like leaving the app.
      toolbarColor: "#FFFFFF",
      controlsColor: "#0A7F8D",
      dismissButtonStyle: "close",
    });
  } catch {
    // Last resort: let the system decide what can open it.
    Linking.openURL(BOOKING_URL).catch(() => {});
  }
}
