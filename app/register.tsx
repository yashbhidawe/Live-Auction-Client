import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
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

export default function RegisterScreen() {
  const {
    signUp,
    isLoaded: signUpLoaded,
    setActive: setActiveSignUp,
  } = useSignUp();
  const {
    signIn,
    isLoaded: signInLoaded,
    setActive: setActiveSignIn,
  } = useSignIn();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showEmailCode, setShowEmailCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const onSignUpPress = useCallback(async () => {
    if (!signUpLoaded || !signUp) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Email and password required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress: trimmed, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
          : "Sign up failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [signUp, signUpLoaded, email, password]);

  const onVerifySignUp = useCallback(async () => {
    if (!signUpLoaded || !signUp || !setActiveSignUp) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        // AuthGate will redirect to /(tabs), AuthSync will handle user sync
      } else {
        setError("Verification incomplete");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
          : "Verification failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [signUp, signUpLoaded, setActiveSignUp, code]);

  const onSignInPress = useCallback(async () => {
    if (!signInLoaded || !signIn || !setActiveSignIn) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Email and password required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: trimmed,
        password,
      });
      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
        // AuthGate will redirect to /(tabs), AuthSync will handle user sync
      } else if (result.status === "needs_second_factor") {
        const emailFactor = result.supportedSecondFactors?.find(
          (f): f is EmailCodeFactor => f.strategy === "email_code",
        );
        if (emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setShowEmailCode(true);
        }
      } else {
        setError("Sign in incomplete");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
          : "Sign in failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [signIn, signInLoaded, setActiveSignIn, email, password]);

  const onVerifySignIn = useCallback(async () => {
    if (!signInLoaded || !signIn || !setActiveSignIn) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });
      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
        // AuthGate will redirect to /(tabs), AuthSync will handle user sync
      } else {
        setError("Verification incomplete");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
          : "Verification failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [signIn, signInLoaded, setActiveSignIn, code]);

  const showVerify = mode === "sign-up" ? pendingVerification : showEmailCode;

  if (showVerify) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center px-8"
        >
          <View className="items-center mb-12">
            <Text className="text-foreground text-3xl font-bold">
              Verify your email
            </Text>
            <Text className="text-muted text-base mt-2">
              Enter the code sent to your email
            </Text>
          </View>
          <View>
            <TextInput
              className="rounded-xl border border-surface bg-surface px-5 py-4 text-foreground text-lg"
              placeholder="Verification code"
              placeholderTextColor="#A1A1B3"
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              editable={!loading}
            />
            {error && (
              <View className="mt-3 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3">
                <Text className="text-danger text-sm">{error}</Text>
              </View>
            )}
            <Pressable
              onPress={mode === "sign-up" ? onVerifySignUp : onVerifySignIn}
              disabled={loading}
              className="mt-6 rounded-xl bg-primary py-4 active:opacity-90 items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">Verify</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
            {mode === "sign-in" ? "Sign in to continue" : "Create your account"}
          </Text>
        </View>

        <View>
          <TextInput
            className="rounded-xl border border-surface bg-surface px-5 py-4 text-foreground text-lg"
            placeholder="Email"
            placeholderTextColor="#A1A1B3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            className="rounded-xl border border-surface bg-surface px-5 py-4 text-foreground text-lg mt-4"
            placeholder="Password"
            placeholderTextColor="#A1A1B3"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {error && (
            <View className="mt-3 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={mode === "sign-in" ? onSignInPress : onSignUpPress}
            disabled={loading}
            className="mt-6 rounded-xl bg-primary py-4 active:opacity-90 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {mode === "sign-in" ? "Sign in" : "Sign up"}
              </Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row items-center justify-center gap-2">
            <Text className="text-muted">
              {mode === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setError(null);
              }}
            >
              <Text className="text-primary font-semibold">
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
