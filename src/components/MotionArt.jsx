import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export const MotionContext = createContext(true);

// SVG animations live inside the image document. Swapping to its supplied still
// is necessary: a CSS animation rule on the surrounding page cannot pause it.
export default function MotionArt({
  name,
  className = "",
  mode = "hover",
  alt = "",
  eager = false,
}) {
  const reduced = useContext(MotionContext);
  const ref = useRef(null);
  const instance = useId();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [eventPlaying, setEventPlaying] = useState(mode === "event");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setEventPlaying(mode === "event");
    if (mode !== "event") return;
    const timer = setTimeout(() => setEventPlaying(false), 4000);
    return () => clearTimeout(timer);
  }, [mode, name]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (ref.current) observer.observe(ref.current);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    const control = ref.current?.closest("button,a");
    if (!control) return;
    const focus = () => setFocused(true),
      blur = () => setFocused(false);
    control.addEventListener("focus", focus);
    control.addEventListener("blur", blur);
    return () => {
      control.removeEventListener("focus", focus);
      control.removeEventListener("blur", blur);
    };
  }, []);
  const animated =
    !reduced &&
    visible &&
    pageVisible &&
    (mode === "idle" ||
      (mode === "event" && eventPlaying) ||
      (mode === "hover" && (hovered || focused)));
  return (
    <span
      ref={ref}
      className={`motion-art ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={`/assets/zhuddle/${name}-${animated ? "animated" : "still"}.svg${animated && mode === "event" ? `?event=${encodeURIComponent(instance)}` : ""}`}
        width="160"
        height="160"
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </span>
  );
}
