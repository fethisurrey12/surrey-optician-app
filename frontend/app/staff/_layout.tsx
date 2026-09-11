import { Stack } from "expo-router";

import { themes } from "@/src/theme";

// The desk's own stack. It sits outside the patient session deliberately: a
// colleague is not signed in as anybody, so none of the app's sign-in redirects
// apply here (see the route guard in app/_layout.tsx).
export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: themes.light.paper },
      }}
    />
  );
}
