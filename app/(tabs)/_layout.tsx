import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { SyncBanner } from "@/components/SyncBanner";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <SyncBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 14,
            borderRadius: 16,
            height: 62,
            paddingTop: 6,
            backgroundColor: "rgba(21,21,39,0.95)",
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
      </Tabs>
    </View>
  );
}
