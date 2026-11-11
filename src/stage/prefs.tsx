import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Per-viewer media preferences, remembered on this device. */
export interface MediaPrefs {
  muted: boolean;
  captions: boolean;
  rate: number;
}

export const PLAYBACK_RATES = [0.85, 1, 1.15, 1.3] as const;
const KEY = 'good-hands:media-prefs:v1';
const defaults: MediaPrefs = { muted: false, captions: true, rate: 1 };

function load(): MediaPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<MediaPrefs> | null;
    return {
      muted: typeof raw?.muted === 'boolean' ? raw.muted : defaults.muted,
      captions: typeof raw?.captions === 'boolean' ? raw.captions : defaults.captions,
      rate: PLAYBACK_RATES.includes(raw?.rate as (typeof PLAYBACK_RATES)[number]) ? (raw!.rate as number) : defaults.rate,
    };
  } catch {
    return defaults;
  }
}

interface PrefsApi extends MediaPrefs {
  update(patch: Partial<MediaPrefs>): void;
}

const PrefsContext = createContext<PrefsApi | null>(null);

export function MediaPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<MediaPrefs>(load);
  const update = useCallback((patch: Partial<MediaPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // preference is still applied for this session
      }
      return next;
    });
  }, []);
  const api = useMemo(() => ({ ...prefs, update }), [prefs, update]);
  return <PrefsContext.Provider value={api}>{children}</PrefsContext.Provider>;
}

export function useMediaPrefs(): PrefsApi {
  const api = useContext(PrefsContext);
  if (!api) throw new Error('useMediaPrefs must be used inside MediaPrefsProvider');
  return api;
}
