import { useEffect, useState } from 'react';

/**
 * "sonando: Nutshell — Alice in Chains", en vivo desde Last.fm (gratis; se conecta a Spotify).
 * Si no hay usuario o clave configurados, o Last.fm no responde, no muestra nada.
 * Se actualiza cada minuto mientras la pestaña está visible.
 */
interface Props {
  user?: string;
  apiKey?: string;
  labels?: { now: string; last: string };
}

interface Track {
  name: string;
  artist: string;
  url: string;
  nowPlaying: boolean;
}

export default function NowPlaying({ user, apiKey, labels = { now: 'sonando', last: 'lo último que sonó' } }: Props) {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!user || !apiKey) return;
    let cancelled = false;

    const load = async () => {
      if (document.hidden) return;
      try {
        const url =
          'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&format=json&limit=1' +
          `&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const t = json?.recenttracks?.track?.[0];
        if (!t || cancelled) return;
        setTrack({
          name: t.name,
          artist: t.artist?.['#text'] ?? '',
          url: t.url,
          nowPlaying: t['@attr']?.nowplaying === 'true',
        });
      } catch {
        // sin red o Last.fm caído: no pasa nada, simplemente no se muestra
      }
    };

    load();
    const id = setInterval(load, 60_000);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', load);
    };
  }, [user, apiKey]);

  if (!track) return null;

  return (
    <p className="now-playing mono">
      {track.nowPlaying ? (
        <span className="np-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ) : null}
      <span className="np-label">{track.nowPlaying ? labels.now : labels.last}</span>{' '}
      <a href={track.url} target="_blank" rel="noopener">
        {track.name} — {track.artist}
      </a>
    </p>
  );
}
