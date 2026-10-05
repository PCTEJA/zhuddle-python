import { useContext, useEffect, useRef, useState } from "react";
import { MotionContext } from "./MotionArt";

const POSTER = "/assets/zhuddle/emerald-aurora-learner-banner.png";

export default function BannerMedia() {
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
      <img className="hero-garden" src={POSTER} alt="" width="2129" height="738" fetchPriority="high" />
      {!reducedMotion && !failed && (
        <video
          ref={videoRef}
          className={`hero-garden hero-video${playing ? " is-playing" : ""}`}
          src="/assets/zhuddle/welcome-banner.mp4"
          poster={POSTER}
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
