import type { NetworkStatus } from "@/utils/network-quality";
import type { AudioLink } from "./play";

export interface QualitySources {
  hq: AudioLink;
  rq: AudioLink;
  lq: AudioLink;
}

/**
 * Pick an audio source for a network status: high quality on a good
 * connection, low quality when offline, regular quality otherwise (slow, or
 * still settling).
 */
export const selectAudioQuality = (
  sources: QualitySources,
  status: NetworkStatus,
): AudioLink => {
  switch (status) {
    case "good":
      return sources.hq;
    case "offline":
      return sources.lq;
    default:
      return sources.rq;
  }
};
