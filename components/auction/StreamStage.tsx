import { StyleSheet, View } from "react-native";
import { AgoraVideo } from "@/components/AgoraVideo";
import type { AgoraRole } from "@/lib/agora";
import type { AuctionStatus } from "@/types/auction";

type StreamStageProps = {
  role: AgoraRole;
  joined: boolean;
  remoteUid: number | null;
  uid: number;
  channelId?: string;
  auctionStatus?: AuctionStatus;
};

export function StreamStage({
  role,
  joined,
  remoteUid,
  uid,
  channelId,
  auctionStatus,
}: StreamStageProps) {
  return (
    <>
      <AgoraVideo
        role={role}
        joined={joined}
        remoteUid={remoteUid}
        uid={uid}
        channelId={channelId}
        auctionStatus={auctionStatus}
      />
      <View pointerEvents="none" style={styles.topScrim} />
      <View pointerEvents="none" style={styles.bottomScrim} />
    </>
  );
}

const styles = StyleSheet.create({
  topScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
});
