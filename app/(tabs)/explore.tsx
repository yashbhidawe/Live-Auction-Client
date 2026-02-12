import { Text, View } from "react-native";

export default function ExploreScreen() {
  return (
    <View className="flex-1 bg-background px-6 py-8">
      <Text className="text-muted text-xs uppercase tracking-wider">Explore</Text>
      <Text className="text-foreground mt-2 text-3xl font-bold">
        Discover auctions
      </Text>
      <Text className="text-muted mt-2 text-sm">
        Search and category discovery are coming next. For now, jump into live
        rooms from Home and create new rooms from Create.
      </Text>

      <View className="mt-8 rounded-2xl border border-surface bg-surface p-5">
        <Text className="text-foreground text-base font-semibold">
          What is next
        </Text>
        <Text className="text-muted mt-2 text-sm">- Category filters</Text>
        <Text className="text-muted mt-2 text-sm">- Trending live rooms</Text>
        <Text className="text-muted mt-2 text-sm">- Seller profiles</Text>
      </View>
    </View>
  );
}
