import React, { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Box } from '@mui/material';

const VideoPlayer = forwardRef(({ onReady, src, type }, ref) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const tracksRef = useRef({}); // Per gestire i sottotitoli

  useEffect(() => {
    const videoJsOptions = {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: true,
      controlBar: {
        skipButtons: {
          forward: 10,
          backward: 10,
        },
      },
    };

    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, videoJsOptions, () => {
        if (src) {
          player.src({ type, src });
        }
        onReady && onReady(player);
      });

      // Creiamo le tracce per ogni lingua usando addTextTrack
      tracksRef.current.english = player.addTextTrack("subtitles", "English", "en");
      tracksRef.current.french = player.addTextTrack("subtitles", "Français", "fr");
      tracksRef.current.arabic = player.addTextTrack("subtitles", "العربية", "ar");

      // Forza la visualizzazione delle tracce
      tracksRef.current.english.mode = "showing";
      tracksRef.current.french.mode = "showing";
      tracksRef.current.arabic.mode = "showing";

      playerRef.current = player;
    } else {
      const player = playerRef.current;
      if (src) {
        player.src({ type, src });
      }
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [onReady, src, type]);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      if (playerRef.current) {
        return playerRef.current.currentTime();
      }
      return 0;
    },
    addSubtitle: (lang, startTime, endTime, text) => {
      if (tracksRef.current[lang]) {
        const cue = new window.VTTCue(startTime, endTime, text);
        tracksRef.current[lang].addCue(cue);
      }
    },
    updateSubtitleEndTime: (lang, startTime, endTime) => {
      if (tracksRef.current[lang]) {
        const cues = tracksRef.current[lang].cues;
        for (let i = 0; i < cues.length; i++) {
          const cue = cues[i];
          if (cue.startTime.toFixed(2) === startTime.toFixed(2)) {
            cue.endTime = endTime; // Aggiorna il timestamp di fine
            break;
          }
        }
      }
    },
    // Funzione per ottenere la traccia di sottotitoli per una lingua specifica
    getTrack: (lang) => {
      return tracksRef.current[lang] || null;
    },
    // Funzione per rimuovere una cue specifica dal video
    removeSubtitleCue: (lang, startTime) => {
      const track = tracksRef.current[lang];
      if (track) {
        const cues = track.cues;
        for (let i = 0; i < cues.length; i++) {
          const cue = cues[i];
          if (cue.startTime.toFixed(2) === startTime.toFixed(2)) {
            track.removeCue(cue); // Rimuovi la cue che corrisponde al startTime
            break;
          }
        }
      }
    },
    // Funzione per saltare a un tempo specifico nel video
    seekToTime: (time) => {
      if (playerRef.current) {
        playerRef.current.currentTime(time); // Imposta il tempo corrente del video
        playerRef.current.play(); // Fa partire la riproduzione del video da quel punto
      }
    },
  }));

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <div data-vjs-player>
        <div ref={videoRef} />
      </div>
    </Box>
  );
});

export default VideoPlayer;
