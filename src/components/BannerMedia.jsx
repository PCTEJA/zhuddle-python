import { useContext, useEffect, useRef, useState } from "react";
import { MotionContext } from "./MotionArt";

const POSTER = "/assets/zhuddle/welcome-poster-v1.webp";

export default function BannerMedia({
  src = "/assets/zhuddle/welcome-banner-v2.mp4",
  poster = POSTER,
  imageClassName = "hero-garden",
  videoClassName = "hero-garden hero-video",
  imageProps = { width: 1280, height: 444, fetchPriority: "high" },
}) {
  const reducedMotion = useContext(MotionContext);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveData, setSaveData] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (imageRef.current) observer.observe(imageRef.current);
    const visibility = () => setPageVisible(!document.hidden);
    const load = () => setLoaded(true);
    const connection = navigator.connection;
    const connectionChange = () => setSaveData(Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType || ''));
    visibility();
    connectionChange();
    if (document.readyState === 'complete') load();
    else window.addEventListener('load', load, { once: true });
    document.addEventListener('visibilitychange', visibility);
    connection?.addEventListener('change', connectionChange);
    return () => {
      observer.disconnect();
      window.removeEventListener('load', load);
      document.removeEventListener('visibilitychange', visibility);
      connection?.removeEventListener('change', connectionChange);
    };
  }, []);

  const active = loaded && visible && pageVisible && !reducedMotion && !saveData && !failed;
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
  }, [active]);

  return (
    <>
      <img ref={imageRef} className={imageClassName} src={poster} alt="" decoding="async" {...imageProps} />
      {active && (
        <video
          ref={videoRef}
          className={`${videoClassName}${playing ? " is-playing" : ""}`}
          src={src}
          poster={poster}
          preload="none"
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
