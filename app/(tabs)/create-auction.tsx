import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { auctionApi } from "@/lib/api";
import { useAuctionStore } from "@/store/auctionStore";

const itemSchema = z.object({
  name: z.string().min(1, "Name required"),
  startingPrice: z.coerce.number().min(0, "Must be >= 0"),
  durationSec: z.coerce.number().min(1).max(300).optional(),
});

const formSchema = z.object({
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof formSchema>;

const defaultItem: FormData["items"][0] = {
  name: "",
  startingPrice: 0,
  durationSec: 60,
};

const DURATION_PRESETS = [30, 60, 120] as const;

export default function CreateAuctionScreen() {
  const router = useRouter();
  const { addAuction, user, syncError, syncLoading } = useAuctionStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const stats = useMemo(() => {
    const count = items.length;
    const totalStartingPrice = items.reduce(
      (sum, item) => sum + (Number(item.startingPrice) || 0),
      0,
    );
    const totalDurationSec = items.reduce(
      (sum, item) => sum + (Number(item.durationSec) || 60),
      0,
    );
    return { count, totalStartingPrice, totalDurationSec };
  }, [items]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user) {
        setSubmitError("Please sign in to create an auction");
        return;
      }
      setSubmitError(null);
      setLoading(true);
      try {
        const payload = {
          sellerId: user.id,
          items: data.items.map((item) => ({
            name: item.name.trim(),
            startingPrice: Number(item.startingPrice),
            durationSec: item.durationSec
              ? Number(item.durationSec)
              : undefined,
          })),
        };
        const state = await auctionApi.createAuction(payload);
        addAuction(state);
        router.replace(`/auction/${state.id}` as const);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [addAuction, router, user],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="border-b border-surface px-5 py-4">
          <Text className="text-muted text-xs uppercase tracking-wider">
            Seller Console
          </Text>
          <Text className="text-foreground mt-1 text-2xl font-bold">
            Create auction
          </Text>
          {user && (
            <Text className="text-muted mt-1 text-xs">
              Creating as {user.displayName}
            </Text>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-40"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-xl border border-surface bg-surface p-3">
              <Text className="text-muted text-xs">ITEMS</Text>
              <Text className="text-foreground mt-1 text-lg font-bold">
                {stats.count}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-surface bg-surface p-3">
              <Text className="text-muted text-xs">TOTAL START</Text>
              <Text className="text-foreground mt-1 text-lg font-bold">
                ${stats.totalStartingPrice}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-surface bg-surface p-3">
              <Text className="text-muted text-xs">EST. TIME</Text>
              <Text className="text-foreground mt-1 text-lg font-bold">
                {Math.ceil(stats.totalDurationSec / 60)}m
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-muted text-xs uppercase tracking-wider">
              Auction items
            </Text>
            <Pressable
              onPress={() => append({ ...defaultItem })}
              className="rounded-full bg-primary px-4 py-2 active:opacity-85"
            >
              <Text className="text-xs font-semibold text-white">+ Add item</Text>
            </Pressable>
          </View>

          {fields.map((field, index) => (
            <View
              key={field.id}
              className="mt-3 rounded-2xl border border-surface bg-surface p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-sm font-semibold">
                  Item {index + 1}
                </Text>
                {fields.length > 1 && (
                  <Pressable
                    onPress={() => remove(index)}
                    className="rounded-full bg-danger/20 px-3 py-1.5 active:opacity-80"
                  >
                    <Text className="text-danger text-xs font-semibold">Remove</Text>
                  </Pressable>
                )}
              </View>

              <Text className="text-muted mt-4 text-xs">Name</Text>
              <Controller
                control={control}
                name={`items.${index}.name`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="mt-1 rounded-xl border border-background bg-background px-3 py-2.5 text-foreground"
                    placeholder="Vintage watch, sneakers, artwork..."
                    placeholderTextColor="#A1A1B3"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.items?.[index]?.name && (
                <Text className="text-danger mt-1 text-xs">
                  {errors.items[index]?.name?.message}
                </Text>
              )}

              <Text className="text-muted mt-3 text-xs">Starting price (USD)</Text>
              <Controller
                control={control}
                name={`items.${index}.startingPrice`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="mt-1 rounded-xl border border-background bg-background px-3 py-2.5 text-foreground"
                    placeholder="0"
                    placeholderTextColor="#A1A1B3"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value === 0 ? "" : String(value)}
                  />
                )}
              />
              {errors.items?.[index]?.startingPrice && (
                <Text className="text-danger mt-1 text-xs">
                  {errors.items[index]?.startingPrice?.message}
                </Text>
              )}

              <Text className="text-muted mt-3 text-xs">Duration (seconds)</Text>
              <Controller
                control={control}
                name={`items.${index}.durationSec`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput
                      className="mt-1 rounded-xl border border-background bg-background px-3 py-2.5 text-foreground"
                      placeholder="60"
                      placeholderTextColor="#A1A1B3"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={
                        value === undefined || value === null ? "" : String(value)
                      }
                    />
                    <View className="mt-2 flex-row gap-2">
                      {DURATION_PRESETS.map((preset) => {
                        const active = Number(value ?? 60) === preset;
                        return (
                          <Pressable
                            key={`${field.id}-${preset}`}
                            onPress={() =>
                              setValue(`items.${index}.durationSec`, preset, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            className={`rounded-full px-3 py-1.5 ${
                              active ? "bg-primary" : "bg-background"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                active ? "text-white" : "text-muted"
                              }`}
                            >
                              {preset}s
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
              />
            </View>
          ))}

          {errors.items?.root && (
            <Text className="text-danger mt-2 text-xs">
              {errors.items.root.message}
            </Text>
          )}

          {submitError && (
            <View className="mt-4 rounded-xl border border-danger/50 bg-danger/10 p-3">
              <Text className="text-danger text-sm">{submitError}</Text>
            </View>
          )}

          {!user && !loading && (
            <Text className="text-muted mt-4 text-center text-sm">
              {syncError
                ? "Sync failed. Tap Retry above."
                : syncLoading
                  ? "Signing you in..."
                  : "Signing you in..."}
            </Text>
          )}
        </ScrollView>

        <View className="border-t border-surface bg-background px-5 py-4">
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loading || !user}
            className="rounded-xl bg-primary py-4 active:opacity-90 disabled:opacity-70"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-semibold text-white">
                Create & open auction
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
