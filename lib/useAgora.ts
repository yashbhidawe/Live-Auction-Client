import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { env } from "@/constants/env";
import { fetchAgoraToken, AGORA_CHANNEL, type AgoraRole } from "./agora";

const isNative = Platform.OS !== "web";

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }
  // iOS permissions are handled by Info.plist + system prompt automatically
  return true;
}

export function useAgora(role: AgoraRole) {
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<{
    leaveChannel: () => number;
    release: (sync?: boolean) => void;
  } | null>(null);
  const uidRef = useRef(Math.floor(Math.random() * 100000) + 1);

  const join = useCallback(async () => {
    if (!isNative) {
      setError("Video only in native app (dev client)");
      return;
    }
    setError(null);
    try {
      const hasPerms = await requestPermissions();
      if (!hasPerms) {
        setError("Camera & microphone permissions are required");
        return;
      }
      const { createAgoraRtcEngine, RtcEngineContext, ChannelMediaOptions } =
        await import("react-native-agora");
      const appId = env.agoraAppId;
      if (!appId) {
        setError("EXPO_PUBLIC_AGORA_APP_ID not set");
        return;
      }
      const token = await fetchAgoraToken(AGORA_CHANNEL, uidRef.current, role);
      const engine = createAgoraRtcEngine();

      const ctx = new RtcEngineContext();
      ctx.appId = appId;
      engine.initialize(ctx);

      const options = new ChannelMediaOptions();
      options.publishCameraTrack = role === "seller";
      options.publishMicrophoneTrack = role === "seller";
      options.autoSubscribeAudio = true;
      options.autoSubscribeVideo = true;

      engine.registerEventHandler({
        onJoinChannelSuccess: () => setJoined(true),
        onUserJoined: (_conn: unknown, u: number) => setRemoteUid(u),
        onUserOffline: () => setRemoteUid(null),
        onError: (err: number, msg?: string) => setError(msg ?? `Error ${err}`),
      });

      engine.joinChannel(token, AGORA_CHANNEL, uidRef.current, options);

      if (role === "seller") {
        engine.enableLocalVideo(true);
        engine.startPreview();
      }

      engineRef.current = engine;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[useAgora] join failed:", msg, e);
      setError(msg);
    }
  }, [role]);

  const leave = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.leaveChannel();
      engineRef.current.release();
      engineRef.current = null;
    }
    setJoined(false);
    setRemoteUid(null);
  }, []);

  useEffect(() => () => leave(), [leave]);

  return {
    joined,
    remoteUid,
    error,
    join,
    leave,
    uid: uidRef.current,
    channel: AGORA_CHANNEL,
  };
}
