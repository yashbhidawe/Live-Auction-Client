/**
 * Agora RTC helpers. Uses backend token endpoint; single channel POC.
 * Requires native build (expo-dev-client); does not run in Expo Go or web.
 */

import { env } from "@/constants/env";

const AGORA_CHANNEL = "auction-live";

export type AgoraRole = "seller" | "buyer";

export async function fetchAgoraToken(
  channel: string,
  uid: number,
  role: AgoraRole,
): Promise<string> {
  const base = env.socketUrl.replace(/\/$/, "");
  const url = `${base}/agora/token?channel=${encodeURIComponent(channel)}&uid=${uid}&role=${role}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { token: string };
  return data.token;
}

export { AGORA_CHANNEL };
