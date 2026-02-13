import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { AgoraRole } from "@/lib/agora";
import type { AuctionStatus } from "@/types/auction";

type AgoraVideoProps = {
  role: AgoraRole;
  joined: boolean;
  remoteUid: number | null;
  uid: number;
  channelId?: string;
  auctionStatus?: AuctionStatus;
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
  auctionStatus,
}: AgoraVideoProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const videoAspectRatio = 9 / 16;
  const screenAspectRatio = screenWidth / Math.max(1, screenHeight);
  const viewportWidth =
    screenAspectRatio > videoAspectRatio
      ? screenWidth
      : screenHeight * videoAspectRatio;
  const viewportHeight =
    screenAspectRatio > videoAspectRatio
      ? screenWidth / videoAspectRatio
      : screenHeight;

  if (Platform.OS === "web") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Live video only in native app
        </Text>
      </View>
    );
  }

  if (auctionStatus === "ENDED") {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Auction ended</Text>
      </View>
    );
  }

  if (!joined) {
    const waitingText =
      role === "buyer" && auctionStatus === "CREATED"
        ? "Auction will start soon"
        : role === "seller" && auctionStatus === "CREATED"
          ? "Preparing camera preview…"
          : "Preparing live stream…";
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{waitingText}</Text>
      </View>
    );
  }

  try {
    const { RtcSurfaceView, RtcTextureView, RenderModeType } =
      require("react-native-agora");
    const fitRenderMode = RenderModeType?.RenderModeFit ?? 2;
    const Renderer =
      Platform.OS === "android" && RtcTextureView ? RtcTextureView : RtcSurfaceView;
    const viewportStyle = {
      width: viewportWidth,
      height: viewportHeight,
    };

    if (role === "seller") {
      return (
        <View style={styles.stage}>
          <Renderer
            canvas={{ uid: 0, renderMode: fitRenderMode }}
            style={viewportStyle}
          />
        </View>
      );
    }

    if (role === "buyer" && remoteUid != null) {
      return (
        <View style={styles.stage}>
          <Renderer
            canvas={{
              uid: remoteUid,
              renderMode: fitRenderMode,
              ...(channelId ? { channelId } : {}),
            }}
            style={viewportStyle}
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
  stage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0B12",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
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
