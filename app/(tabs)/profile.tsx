import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

const MAX_NAME_LENGTH = 64;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { user, setUser } = useAuctionStore();

  const initial = useMemo(
    () => user?.displayName ?? "",
    [user?.displayName],
  );
  const [displayName, setDisplayName] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = useCallback(async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Display name is required");
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Max ${MAX_NAME_LENGTH} characters`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await userApi.updateMe(trimmed);
      setUser({ id: updated.id, displayName: updated.displayName });
      if (clerkUser) {
        const currentMeta =
          (clerkUser.unsafeMetadata as Record<string, unknown> | undefined) ??
          {};
        await clerkUser.update({
          unsafeMetadata: {
            ...currentMeta,
            displayName: updated.displayName,
          },
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [displayName, setUser, clerkUser, router]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1 px-6"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between py-4">
          <Pressable onPress={() => router.back()} className="px-2 py-1">
            <Text className="text-primary text-base font-semibold">Back</Text>
          </Pressable>
          <Text className="text-foreground text-lg font-semibold">
            Edit profile
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View className="mt-4 rounded-2xl border border-surface bg-surface p-4">
          <Text className="text-muted text-xs uppercase tracking-wider">
            Display name
          </Text>
          <TextInput
            className="mt-2 rounded-xl border border-background bg-background px-4 py-3 text-foreground text-base"
            value={displayName}
            onChangeText={(v) => {
              if (v.length <= MAX_NAME_LENGTH) setDisplayName(v);
              if (error) setError(null);
            }}
            placeholder="Your name"
            placeholderTextColor="#A1A1B3"
            editable={!loading}
            autoCapitalize="words"
            maxLength={MAX_NAME_LENGTH}
          />
          <Text className="text-muted mt-2 text-xs text-right">
            {displayName.length}/{MAX_NAME_LENGTH}
          </Text>
        </View>

        {error && (
          <View className="mt-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={onSave}
          disabled={loading}
          className="mt-6 rounded-xl bg-primary py-4 active:opacity-90 items-center disabled:opacity-70"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Save changes</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
