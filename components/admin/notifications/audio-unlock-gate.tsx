"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canManageNotifications } from "@/lib/admin/permissions";
import {
  getSessionOperationalAudioUnlocked,
  getOperationalAudioPromptEligibility,
  hasRememberedOperationalAudioSetup,
  markOperationalAudioSessionUnlocked,
  persistOperationalAudioUnlocked,
  subscribeOperationalAudioSession,
  unlockOperationalAudio
} from "@/lib/notifications/audio";
import type { ProfileRole } from "@/types/database";
import AudioUnlockModal from "@/components/admin/notifications/audio-unlock-modal";

const DEBUG_AUDIO_UNLOCK = process.env.NODE_ENV === "development";
const AUDIO_UNLOCK_MODAL_DELAY_MS = 450;
const NEW_ORDER_SOUND_SRC = "/sounds/new-order-sound.mp3";

type AudioUnlockGateProps = {
  currentUserRole: ProfileRole;
  soundEnabled: boolean;
};

function debugAudioUnlock(event: string, payload?: Record<string, unknown>) {
  if (DEBUG_AUDIO_UNLOCK) {
    console.info(`[audio-unlock] ${event}`, payload ?? {});
  }
}

export default function AudioUnlockGate({
  currentUserRole,
  soundEnabled
}: AudioUnlockGateProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activateInFlightRef = useRef(false);

  useEffect(() => {
    setHasMounted(true);
    debugAudioUnlock("mounted", {
      role: currentUserRole
    });
  }, [currentUserRole]);

  useEffect(() => {
    setSessionUnlocked(getSessionOperationalAudioUnlocked());
    debugAudioUnlock("session state", {
      sessionAudioUnlocked: getSessionOperationalAudioUnlocked()
    });
    debugAudioUnlock("remembered setup", {
      rememberedAudioSetup: hasRememberedOperationalAudioSetup()
    });

    return subscribeOperationalAudioSession((nextValue) => {
      setSessionUnlocked(nextValue);
      debugAudioUnlock("session state", {
        sessionAudioUnlocked: nextValue
      });
    });
  }, []);

  useEffect(() => {
    const canUseOperationalAudio = canManageNotifications(currentUserRole);
    const eligibility = getOperationalAudioPromptEligibility();
    const shouldShow =
      hasMounted &&
      canUseOperationalAudio &&
      soundEnabled &&
      eligibility.sessionAudioUnlocked === false;

    debugAudioUnlock("eligibility", {
      canUseOperationalAudio,
      delayElapsed: false,
      hasMounted,
      rememberedAudioSetup: eligibility.rememberedAudioSetup,
      role: currentUserRole,
      sessionAudioUnlocked: eligibility.sessionAudioUnlocked,
      soundEnabled,
      shouldShow
    });

    if (!hasMounted) {
      debugAudioUnlock("skipped", {
        reason: "notMounted"
      });
      return;
    }

    if (!canUseOperationalAudio) {
      setIsOpen(false);
      debugAudioUnlock("skipped", {
        reason: "roleNotAllowed",
        role: currentUserRole
      });
      return;
    }

    if (!soundEnabled) {
      setIsOpen(false);
      setError(null);
      debugAudioUnlock("skipped", {
        reason: "soundDisabled",
        role: currentUserRole
      });
      return;
    }

    if (eligibility.sessionAudioUnlocked) {
      setIsOpen(false);
      debugAudioUnlock("skipped", {
        reason: "sessionUnlocked"
      });
      return;
    }

    debugAudioUnlock("skipped", {
      reason: "delayPending"
    });

    const timer = window.setTimeout(() => {
      const latestEligibility = getOperationalAudioPromptEligibility();

      if (latestEligibility.sessionAudioUnlocked) {
        debugAudioUnlock("skipped", {
          reason: "sessionUnlocked"
        });
        return;
      }

      debugAudioUnlock("eligibility", {
        canUseOperationalAudio,
        delayElapsed: true,
        hasMounted: true,
        rememberedAudioSetup: latestEligibility.rememberedAudioSetup,
        role: currentUserRole,
        sessionAudioUnlocked: latestEligibility.sessionAudioUnlocked,
        soundEnabled,
        shouldShow: true
      });
      debugAudioUnlock("showing", {
        role: currentUserRole
      });
      setIsOpen(true);
    }, AUDIO_UNLOCK_MODAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentUserRole, hasMounted, sessionUnlocked, soundEnabled]);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const audio = audioRef.current ?? new Audio(NEW_ORDER_SOUND_SRC);

    if (!audioRef.current) {
      audio.preload = "auto";
      audio.volume = 0.55;
      audioRef.current = audio;
    }

    return audio;
  }, []);

  const handleActivate = useCallback(async () => {
    if (activateInFlightRef.current) {
      return;
    }

    const audio = ensureAudio();

    if (!audio) {
      setError("No pudimos preparar el sonido en este navegador.");
      return;
    }

    activateInFlightRef.current = true;
    setError(null);
    setIsPending(true);
    debugAudioUnlock("unlock attempt", {
      rememberedAudioSetup: hasRememberedOperationalAudioSetup(),
      sessionAudioUnlocked: getSessionOperationalAudioUnlocked()
    });

    try {
      await unlockOperationalAudio(audio);
      markOperationalAudioSessionUnlocked(true);
      persistOperationalAudioUnlocked();
      setIsOpen(false);
      debugAudioUnlock("unlock success", {
        rememberedAudioSetup: true,
        role: currentUserRole,
        sessionAudioUnlocked: true
      });
      debugAudioUnlock("activated", {
        role: currentUserRole
      });
    } catch {
      markOperationalAudioSessionUnlocked(false);
      setError("No pudimos preparar el sonido. Probá nuevamente.");
      debugAudioUnlock("unlock failed", {
        rememberedAudioSetup: hasRememberedOperationalAudioSetup(),
        role: currentUserRole,
        sessionAudioUnlocked: false
      });
    } finally {
      activateInFlightRef.current = false;
      setIsPending(false);
    }
  }, [currentUserRole, ensureAudio]);

  return (
    <AudioUnlockModal
      error={error}
      isOpen={isOpen}
      isPending={isPending}
      onActivate={handleActivate}
    />
  );
}
