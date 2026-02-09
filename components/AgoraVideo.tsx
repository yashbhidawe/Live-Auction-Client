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
 * Renders local (seller) or remote (viewer) Agora video.
 * Only works in native dev build; on web or Expo Go shows a placeholder.
 */
export function AgoraVideo({ role, joined, remoteUid, uid }: AgoraVideoProps) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Live video only in native app (run with dev client)
        </Text>
      </View>
    );
  }

  if (!joined) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Not in channel</Text>
      </View>
    );
  }

  try {
    const { RtcSurfaceView } = require("react-native-agora");

    return (
      <View style={styles.container}>
        {role === "seller" && (
          <View style={styles.video}>
            <RtcSurfaceView
              canvas={{ uid: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>You (seller)</Text>
            </View>
          </View>
        )}
        {role === "buyer" && remoteUid != null && (
          <View style={styles.video}>
            <RtcSurfaceView
              canvas={{
                uid: remoteUid,
                ...(channelId ? { channelId } : {}),
              }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Live</Text>
            </View>
          </View>
        )}
        {role === "buyer" && remoteUid == null && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Waiting for seller stream…
            </Text>
          </View>
        )}
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
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  video: {
    flex: 1,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  placeholder: {
    aspectRatio: 16 / 9,
    backgroundColor: "#151527",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  placeholderText: {
    color: "#A1A1B3",
    fontSize: 14,
    textAlign: "center",
  },
});
