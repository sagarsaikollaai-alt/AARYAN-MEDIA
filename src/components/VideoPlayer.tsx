import React, { useCallback, useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoId: string;
  token: string;
  expires: number;
  resumeSeconds?: number;
  autoplay?: boolean;
  onProgress?: (
    currentSeconds: number,
    durationSeconds: number
  ) => void;
  onLeave?: (
    currentSeconds: number,
    durationSeconds: number
  ) => void;
  onEnded?: () => void;
  onPlay?: () => void;
}

function sendPlayerCommand(
  iframe: HTMLIFrameElement | null,
  method: string,
  value?: any
) {
  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    JSON.stringify({
      context: "player.js",
      version: "0.0.1",
      method,
      value,
    }),
    "*"
  );
}

function addPlayerListener(
  iframe: HTMLIFrameElement | null,
  listener: string
) {
  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    JSON.stringify({
      context: "player.js",
      version: "0.0.1",
      method: "addEventListener",
      value: listener,
    }),
    "*"
  );
}

export default function VideoPlayer({
  videoId,
  token,
  expires,
  resumeSeconds = 0,
  autoplay = false,
  onProgress,
  onLeave,
  onEnded,
  onPlay,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const resumeAppliedRef = useRef(false);

  useEffect(() => {
    currentTimeRef.current = 0;
    durationRef.current = 0;
    resumeAppliedRef.current = false;
  }, [videoId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      let data: any;

      try {
        data =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;
      } catch {
        return;
      }

      if (!data || data.context !== "player.js") return;

      if (data.event === "ready") {
        addPlayerListener(iframeRef.current, "timeupdate");
        addPlayerListener(iframeRef.current, "ended");
        addPlayerListener(iframeRef.current, "play");

        if (
          resumeSeconds > 0 &&
          !resumeAppliedRef.current
        ) {
          resumeAppliedRef.current = true;

          sendPlayerCommand(
            iframeRef.current,
            "setCurrentTime",
            resumeSeconds
          );
        }

        if (autoplay) {
          sendPlayerCommand(
            iframeRef.current,
            "play"
          );
        }
      }

      if (data.event === "play") {
        onPlay?.();
      }

      if (data.event === "timeupdate" && data.value) {
        const { seconds, duration } = data.value;

        if (typeof seconds === "number") {
          currentTimeRef.current = seconds;
        }

        if (typeof duration === "number") {
          durationRef.current = duration;
        }

        if (
          onProgress &&
          typeof seconds === "number" &&
          typeof duration === "number"
        ) {
          onProgress(seconds, duration);
        }
      }

      if (data.event === "ended") {
        onEnded?.();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener(
        "message",
        handleMessage
      );
    };
  }, [
    videoId,
    autoplay,
    resumeSeconds,
    onProgress,
    onPlay,
    onEnded,
  ]);

  const flushProgress = useCallback(() => {
    if (
      currentTimeRef.current > 0 &&
      onLeave
    ) {
      onLeave(
        currentTimeRef.current,
        durationRef.current
      );
    }
  }, [onLeave]);

  useEffect(() => {
    window.addEventListener(
      "beforeunload",
      flushProgress
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        flushProgress
      );

      flushProgress();
    };
  }, [flushProgress]);

  const videoSrc =
    `https://iframe.mediadelivery.net/embed/715524/${videoId}` +
    `?token=${encodeURIComponent(token)}` +
    `&expires=${expires}` +
    (autoplay ? "&autoplay=true" : "");

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src={videoSrc}
        loading="lazy"
        className="w-full h-full rounded-xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}