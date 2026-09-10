import { Tabs } from "expo-router";

import { TabBar } from "@/src/ui/TabBar";
import { themes } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: themes.light.paper },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="rewards" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
