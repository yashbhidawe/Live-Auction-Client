import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex flex-1 items-center justify-center bg-background">
      <Text className="text-center text-2xl font-bold text-foreground">
        Live Auction App!
      </Text>
    </View>
  );
}
