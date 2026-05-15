import { useEffect, useRef } from "react";
import type { AppData } from "../domain/types";

const CHANNEL_NAME = "controlrh-sync";

type SyncMessage = { type: "DATA_UPDATED"; data: AppData; origin: string };

const tabId = Math.random().toString(36).slice(2);

export function useBroadcastSync(
  data: AppData,
  setData: React.Dispatch<React.SetStateAction<AppData>>,
  authenticated: boolean
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Track last data reference we broadcast so we don't re-broadcast inbound updates
  const lastBroadcast = useRef<AppData | null>(null);

  useEffect(() => {
    if (!authenticated || !("BroadcastChannel" in window)) return;

    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<SyncMessage>) => {
      if (e.data.type !== "DATA_UPDATED") return;
      if (e.data.origin === tabId) return;
      lastBroadcast.current = e.data.data;
      setData(e.data.data);
    };

    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [authenticated, setData]);

  // Broadcast whenever data changes (but not when the change came from another tab)
  useEffect(() => {
    if (!authenticated) return;
    if (!channelRef.current) return;
    if (lastBroadcast.current === data) {
      lastBroadcast.current = null;
      return;
    }
    const msg: SyncMessage = { type: "DATA_UPDATED", data, origin: tabId };
    channelRef.current.postMessage(msg);
  }, [data, authenticated]);
}
