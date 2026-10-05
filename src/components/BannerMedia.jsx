import { useContext, useEffect, useRef, useState } from "react";
import { MotionContext } from "./MotionArt";

const POSTER = "/assets/zhuddle/emerald-aurora-learner-banner.png";

export default function BannerMedia({
  src = "/assets/zhuddle/welcome-banner.mp4",
  poster = POSTER,
  imageClassName = "hero-garden",
  videoClassName = "hero-garden hero-video",
  imageProps = { width: 2129, height: 738, fetchPriority: "high" },
}) {
  const reducedMotion = useContext(MotionContext);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    video.play().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
      video.pause();
    };
  }, [reducedMotion]);

  return (
    <>
      <img className={imageClassName} src={poster} alt="" {...imageProps} />
      {!reducedMotion && !failed && (
        <video
          ref={videoRef}
          className={`${videoClassName}${playing ? " is-playing" : ""}`}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}
