import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { auctionApi } from "@/lib/api";
import { useAuctionStore } from "@/store/auctionStore";

const itemSchema = z.object({
  name: z.string().min(1, "Name required"),
  startingPrice: z.coerce.number().min(0, "Must be ≥ 0"),
  durationSec: z.coerce.number().min(1).max(300).optional(),
});

const formSchema = z.object({
  sellerId: z.string().min(1, "Your name / seller ID required"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof formSchema>;

const defaultItem: FormData["items"][0] = {
  name: "",
  startingPrice: 0,
  durationSec: 60,
};

export default function CreateAuctionScreen() {
  const router = useRouter();
  const { addAuction, setCurrentUserId } = useAuctionStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = useCallback(
    async (data: FormData) => {
      setSubmitError(null);
      try {
        const payload = {
          sellerId: data.sellerId.trim(),
          items: data.items.map((item) => ({
            name: item.name.trim(),
            startingPrice: Number(item.startingPrice),
            durationSec: item.durationSec
              ? Number(item.durationSec)
              : undefined,
          })),
        };
        const state = await auctionApi.createAuction(payload);
        setCurrentUserId(data.sellerId.trim());
        addAuction(state);
        router.replace(`/auction/${state.id}` as const);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : String(e));
      }
    },
    [addAuction, router, setCurrentUserId],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-surface px-4 py-3">
        <Text className="text-foreground text-lg font-semibold">
          Create auction
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 pb-24"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-muted mb-1 text-xs uppercase tracking-wider">
          Your name (seller ID)
        </Text>
        <Controller
          control={control}
          name="sellerId"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mt-1 rounded-xl border border-surface bg-surface px-4 py-3 text-foreground"
              placeholder="e.g. seller-1"
              placeholderTextColor="#A1A1B3"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.sellerId && (
          <Text className="text-danger mt-1 text-xs">
            {errors.sellerId.message}
          </Text>
        )}

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-muted text-xs uppercase tracking-wider">
            Items
          </Text>
          <Pressable
            onPress={() => append({ ...defaultItem })}
            className="rounded-lg bg-primary px-3 py-2 active:opacity-80"
          >
            <Text className="text-sm font-medium text-white">Add item</Text>
          </Pressable>
        </View>

        {fields.map((field, index) => (
          <View
            key={field.id}
            className="mt-3 rounded-xl border border-surface bg-surface p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-muted text-xs">Item {index + 1}</Text>
              {fields.length > 1 && (
                <Pressable
                  onPress={() => remove(index)}
                  className="rounded bg-danger/20 px-2 py-1 active:opacity-80"
                >
                  <Text className="text-danger text-xs">Remove</Text>
                </Pressable>
              )}
            </View>
            <Controller
              control={control}
              name={`items.${index}.name`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="mt-2 rounded-lg border border-background bg-background px-3 py-2 text-foreground"
                  placeholder="Item name"
                  placeholderTextColor="#A1A1B3"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.items?.[index]?.name && (
              <Text className="text-danger text-xs">
                {errors.items[index]?.name?.message}
              </Text>
            )}
            <Controller
              control={control}
              name={`items.${index}.startingPrice`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="mt-2 rounded-lg border border-background bg-background px-3 py-2 text-foreground"
                  placeholder="Starting price"
                  placeholderTextColor="#A1A1B3"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value === 0 ? "" : String(value)}
                />
              )}
            />
            {errors.items?.[index]?.startingPrice && (
              <Text className="text-danger text-xs">
                {errors.items[index]?.startingPrice?.message}
              </Text>
            )}
            <Controller
              control={control}
              name={`items.${index}.durationSec`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="mt-2 rounded-lg border border-background bg-background px-3 py-2 text-foreground"
                  placeholder="Duration (sec, optional)"
                  placeholderTextColor="#A1A1B3"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={
                    value === undefined || value === null ? "" : String(value)
                  }
                />
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
          <View className="mt-4 rounded-lg border border-danger/50 bg-danger/10 p-3">
            <Text className="text-danger text-sm">{submitError}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit(onSubmit)}
          className="mt-8 rounded-xl bg-primary py-4 active:opacity-90"
        >
          <Text className="text-center text-lg font-semibold text-white">
            Create & open auction
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
