
"use client";

import { useState, useEffect, useCallback } from 'react';

interface LocalProfile {
  username: string;
  countryCode: string;
  gender: string;
}

const getStorageKey = (uid: string | undefined) => uid ? `wikistars5-local-profile-${uid}` : '';

export function useLocalProfile(uid: string | undefined) {
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(null);
  const storageKey = getStorageKey(uid);

  useEffect(() => {
    if (!storageKey) return;

    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        setLocalProfile(JSON.parse(item));
      } else {
        setLocalProfile(null);
      }
    } catch (error) {
      console.error("Error reading from local storage", error);
      setLocalProfile(null);
    }
  }, [storageKey]);

  const saveLocalProfile = useCallback((username: string, countryCode: string, gender: string) => {
    if (!storageKey) return;
    try {
      const profile: LocalProfile = { username, countryCode, gender };
      window.localStorage.setItem(storageKey, JSON.stringify(profile));
      setLocalProfile(profile);
    } catch (error) {
      console.error("Error saving to local storage", error);
    }
  }, [storageKey]);

  const clearLocalProfile = useCallback(() => {
      if (!storageKey) return;
      try {
        window.localStorage.removeItem(storageKey);
        setLocalProfile(null);
      } catch (error) {
        console.error("Error removing from local storage", error);
      }
  }, [storageKey]);

  return { localProfile, saveLocalProfile, clearLocalProfile };
}
