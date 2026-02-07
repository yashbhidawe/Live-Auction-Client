import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View className="flex flex-1 items-center justify-center bg-background p-6">
      <Text className="mb-4 text-xl font-semibold text-foreground">Modal</Text>
      <Pressable
        onPress={() => router.back()}
        className="rounded-lg bg-primary px-6 py-3"
      >
        <Text className="font-medium text-foreground">Close</Text>
      </Pressable>
    </View>
  );
}
