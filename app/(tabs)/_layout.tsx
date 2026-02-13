import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { SyncBanner } from "@/components/SyncBanner";

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <SyncBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarBackground: () => (
            <BlurView
              intensity={150}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={{ flex: 1, borderRadius: 16 }}
            />
          ),
          tabBarStyle: {
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 14,
            borderRadius: 16,
            overflow: "hidden",
            height: 62,
            paddingTop: 6,
            backgroundColor: "rgba(21,21,39,0.28)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
            borderTopWidth: 0,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
          tabBarActiveTintColor: "#7C5CFF",
          tabBarInactiveTintColor: "#A1A1B3",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create-auction"
          options={{
            title: "Create",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
