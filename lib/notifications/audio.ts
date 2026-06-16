const AUDIO_UNLOCKED_STORAGE_KEY = "orderops:audio-unlocked:v1";
const AUDIO_UNLOCK_DISMISSED_STORAGE_KEY = "orderops:audio-unlock-dismissed:v1";
const AUDIO_UNLOCK_DISMISS_MS = 1000 * 60 * 60 * 24;

type SessionAudioListener = (nextValue: boolean) => void;

let sessionAudioUnlocked = false;
const sessionAudioListeners = new Set<SessionAudioListener>();

export type OperationalAudioPromptEligibility = {
  dismissedRecently: boolean;
  dismissedUntil: number | null;
  rememberedAudioSetup: boolean;
  sessionAudioUnlocked: boolean;
  shouldShow: boolean;
};

export function hasRememberedOperationalAudioSetup() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(AUDIO_UNLOCKED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function getSessionOperationalAudioUnlocked() {
  return sessionAudioUnlocked;
}

export function subscribeOperationalAudioSession(listener: SessionAudioListener) {
  sessionAudioListeners.add(listener);
  return () => {
    sessionAudioListeners.delete(listener);
  };
}

export function persistOperationalAudioUnlocked() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUDIO_UNLOCKED_STORAGE_KEY, "true");
    window.localStorage.removeItem(AUDIO_UNLOCK_DISMISSED_STORAGE_KEY);
  } catch {
    // Ignore localStorage failures. Audio still stays best-effort.
  }
}

export function markOperationalAudioSessionUnlocked(nextValue: boolean) {
  sessionAudioUnlocked = nextValue;

  for (const listener of sessionAudioListeners) {
    listener(nextValue);
  }
}

export function dismissOperationalAudioPrompt(now = Date.now()) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      AUDIO_UNLOCK_DISMISSED_STORAGE_KEY,
      String(now + AUDIO_UNLOCK_DISMISS_MS)
    );
  } catch {
    // Ignore localStorage failures. Prompt may reappear earlier.
  }
}

export function getOperationalAudioDismissedUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const dismissedUntil = Number(
      window.localStorage.getItem(AUDIO_UNLOCK_DISMISSED_STORAGE_KEY) ?? "0"
    );

    return Number.isFinite(dismissedUntil) ? dismissedUntil : null;
  } catch {
    return null;
  }
}

export function getOperationalAudioPromptEligibility(
  now = Date.now()
): OperationalAudioPromptEligibility {
  const rememberedAudioSetup = hasRememberedOperationalAudioSetup();
  const dismissedUntil = getOperationalAudioDismissedUntil();
  const dismissedRecently = dismissedUntil !== null && dismissedUntil > now;

  return {
    dismissedRecently,
    dismissedUntil,
    rememberedAudioSetup,
    sessionAudioUnlocked,
    shouldShow: !sessionAudioUnlocked
  };
}

export async function unlockOperationalAudio(audio: HTMLAudioElement) {
  const previousMuted = audio.muted;
  const previousVolume = audio.volume;

  audio.preload = "auto";
  audio.muted = true;
  audio.volume = 0;
  audio.currentTime = 0;

  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } finally {
    audio.muted = previousMuted;
    audio.volume = previousVolume;
  }
}
