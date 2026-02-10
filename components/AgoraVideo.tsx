import { Platform, StyleSheet, Text, View } from "react-native";
import type { AgoraRole } from "@/lib/agora";

type AgoraVideoProps = {
  role: AgoraRole;
  joined: boolean;
  remoteUid: number | null;
  uid: number;
  channelId?: string;
};

/**
 * Full-screen video background. Renders the seller's camera (local) or the
 * buyer's remote stream using an absolutely-positioned RtcSurfaceView that
 * fills its parent. When there's nothing to show, displays a dark placeholder.
 */
export function AgoraVideo({
  role,
  joined,
  remoteUid,
  uid,
  channelId,
}: AgoraVideoProps) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Live video only in native app
        </Text>
      </View>
    );
  }

  if (!joined) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Connecting to stream…</Text>
      </View>
    );
  }

  try {
    const { RtcSurfaceView } = require("react-native-agora");

    if (role === "seller") {
      return (
        <View style={StyleSheet.absoluteFill}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={StyleSheet.absoluteFill} />
        </View>
      );
    }

    if (role === "buyer" && remoteUid != null) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <RtcSurfaceView
            canvas={{
              uid: remoteUid,
              ...(channelId ? { channelId } : {}),
            }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }

    // Buyer but no remote stream yet
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Waiting for seller to go live…
        </Text>
      </View>
    );
  } catch {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Build with expo-dev-client for video
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0B12",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  placeholderText: {
    color: "#A1A1B3",
    fontSize: 16,
    textAlign: "center",
  },
});
