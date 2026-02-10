import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { userApi } from "@/lib/api";
import { useAuctionStore } from "@/store/auctionStore";

export default function RegisterScreen() {
  const router = useRouter();
  const setUser = useAuctionStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a display name");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await userApi.register(trimmed);
      setUser({ id: user.id, displayName: user.displayName });
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [name, setUser, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-12">
          <Text className="text-foreground text-3xl font-bold">
            Live Auction
          </Text>
          <Text className="text-muted text-base mt-2">
            Enter your name to get started
          </Text>
        </View>

        <View>
          <TextInput
            className="rounded-xl border border-surface bg-surface px-5 py-4 text-foreground text-lg"
            placeholder="Display name"
            placeholderTextColor="#A1A1B3"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleRegister}
            editable={!loading}
          />

          {error && (
            <View className="mt-3 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="mt-6 rounded-xl bg-primary py-4 active:opacity-90 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Join</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
