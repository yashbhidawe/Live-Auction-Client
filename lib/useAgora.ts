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

export function useAgora(role: AgoraRole, channelName?: string) {
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<{
    leaveChannel: () => number;
    release: (sync?: boolean) => void;
    switchCamera: () => number;
    setVideoEncoderConfiguration?: (config: unknown) => number;
    [key: string]: unknown;
  } | null>(null);
  const uidRef = useRef(Math.floor(Math.random() * 100000) + 1);

  const join = useCallback(async () => {
    if (!isNative) {
      setError("Video only in native app (dev client)");
      return;
    }
    const channel = channelName ?? AGORA_CHANNEL;
    if (!channel) {
      setError("Channel name required");
      return;
    }
    setError(null);
    setRemoteUid(null);
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
      const { ChannelProfileType, ClientRoleType } =
        await import("react-native-agora");

      let engine = engineRef.current;
      const isRejoin = engine != null;

      if (!engine) {
        const {
          CameraDirection,
          OrientationMode,
          VideoEncoderConfiguration,
          VideoDimensions,
        } = await import("react-native-agora");
        engine = createAgoraRtcEngine();
        const ctx = new RtcEngineContext();
        ctx.appId = appId;
        ctx.channelProfile = ChannelProfileType.ChannelProfileLiveBroadcasting;
        engine.initialize(ctx);
        engine.enableVideo();
        engine.enableAudio();
        const encoder = new VideoEncoderConfiguration();
        const dimensions = new VideoDimensions();
        dimensions.width = 540;
        dimensions.height = 960;
        encoder.dimensions = dimensions;
        encoder.frameRate = 15;
        encoder.orientationMode = OrientationMode.OrientationModeAdaptive;
        engine.setVideoEncoderConfiguration?.(encoder);
        // Default seller preview to rear camera.
        engine.setCameraCapturerConfiguration?.({
          cameraDirection: CameraDirection.CameraRear,
        });
        engine.registerEventHandler({
          onJoinChannelSuccess: (_conn: unknown, uid: number) => {
            console.log("[useAgora] joined channel", channel, "uid", uid);
            setJoined(true);
          },
          onUserJoined: (_conn: unknown, u: number) => {
            console.log("[useAgora] remote user joined:", u);
            setRemoteUid(u);
          },
          onUserOffline: (_conn: unknown, _uid: number, _reason: number) => {
            console.log("[useAgora] remote user left");
            setRemoteUid(null);
          },
          onError: (err: number, msg?: string) =>
            setError(msg ?? `Error ${err}`),
        });
        engineRef.current = engine;
      }

      const token = await fetchAgoraToken(channel, uidRef.current, role);
      const options = new ChannelMediaOptions();
      options.clientRoleType =
        role === "seller"
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience;
      options.publishCameraTrack = role === "seller";
      options.publishMicrophoneTrack = role === "seller";
      options.autoSubscribeAudio = true;
      options.autoSubscribeVideo = true;

      if (isRejoin) {
        engine.leaveChannel();
      }
      engine.joinChannel(token, channel, uidRef.current, options);

      if (role === "seller") {
        engine.startPreview();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[useAgora] join failed:", msg, e);
      setError(msg);
    }
  }, [role, channelName]);

  const leave = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.leaveChannel();
      // Do not release() - singleton engine is reused so buyer can stay in channel and see seller when they join
    }
    setJoined(false);
    setRemoteUid(null);
  }, []);

  const switchCamera = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.switchCamera();
    }
  }, []);

  useEffect(() => () => leave(), [leave]);

  return {
    joined,
    remoteUid,
    error,
    join,
    leave,
    switchCamera,
    uid: uidRef.current,
    channel: channelName ?? AGORA_CHANNEL,
  };
}
