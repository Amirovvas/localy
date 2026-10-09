"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import css from "./imageViewer.module.css";

interface IProps {
  photos: string[];
  src: string;
  onChange: (src: string) => void;
  onClose: () => void;
}

interface IStageProps {
  src: string;
  onNavigate: (delta: number) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

type GestureMode = "none" | "pan" | "swipe" | "pinch";

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const SWIPE_DISTANCE = 60;
const CLOSE_DISTANCE = 120;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const getFileName = (src: string, mimeType: string) => {
  const last = src.split("?")[0]?.split("/").pop() ?? "";
  if (/\.(jpe?g|png|webp)$/i.test(last)) return last;
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `localy-photo.${extension}`;
};

const PhotoStage = ({ src, onNavigate, onClose }: IStageProps) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [drag, setDrag] = useState<Point>({ x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const lastTap = useRef(0);
  const gesture = useRef({
    mode: "none" as GestureMode,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
    startScale: 1,
    startDistance: 1,
    startMiddle: { x: 0, y: 0 },
    axis: null as "x" | "y" | null,
    moved: false,
    onImage: false,
  });

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDrag({ x: 0, y: 0 });
  };

  const clampOffset = (nextScale: number, point: Point): Point => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image) return point;
    const maxX = Math.max(0, (image.offsetWidth * nextScale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * nextScale - stage.clientHeight) / 2);
    return { x: clamp(point.x, -maxX, maxX), y: clamp(point.y, -maxY, maxY) };
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setScale((current) => {
        const next = clamp(current * (1 - event.deltaY * 0.002), 1, MAX_SCALE);
        if (next === 1) setOffset({ x: 0, y: 0 });
        return next;
      });
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    setGesturing(true);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [Point, Point];
      g.mode = "pinch";
      g.startDistance = Math.max(distance(a, b), 1);
      g.startScale = scale;
      g.startOffset = offset;
      g.startMiddle = middle(a, b);
      g.moved = true;
      return;
    }

    g.mode = scale > 1 ? "pan" : "swipe";
    g.start = { x: event.clientX, y: event.clientY };
    g.startOffset = offset;
    g.axis = null;
    g.moved = false;
    g.onImage = event.target === imageRef.current;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;

    if (g.mode === "pinch" && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [Point, Point];
      const nextScale = clamp((g.startScale * distance(a, b)) / g.startDistance, 1, MAX_SCALE);
      const mid = middle(a, b);
      setScale(nextScale);
      setOffset(
        clampOffset(nextScale, {
          x: g.startOffset.x + (mid.x - g.startMiddle.x),
          y: g.startOffset.y + (mid.y - g.startMiddle.y),
        }),
      );
      return;
    }

    const dx = event.clientX - g.start.x;
    const dy = event.clientY - g.start.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;

    if (g.mode === "pan") {
      setOffset(clampOffset(scale, { x: g.startOffset.x + dx, y: g.startOffset.y + dy }));
      return;
    }

    if (g.mode === "swipe") {
      if (!g.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (g.axis === "x") setDrag({ x: dx, y: 0 });
      if (g.axis === "y") setDrag({ x: 0, y: Math.max(0, dy) });
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const g = gesture.current;

    if (g.mode === "pinch") {
      if (pointers.current.size === 1) {
        const [rest] = [...pointers.current.values()] as [Point];
        g.mode = scale > 1.02 ? "pan" : "swipe";
        g.start = rest;
        g.startOffset = offset;
        g.axis = null;
        g.moved = true;
        return;
      }
      g.mode = "none";
      setGesturing(false);
      if (scale < 1.02) resetView();
      return;
    }

    if (pointers.current.size > 0) return;

    if (g.mode === "swipe") {
      const dx = event.clientX - g.start.x;
      const dy = event.clientY - g.start.y;
      if (g.axis === "x" && Math.abs(dx) > SWIPE_DISTANCE) {
        onNavigate(dx < 0 ? 1 : -1);
      } else if (g.axis === "y" && dy > CLOSE_DISTANCE) {
        onClose();
      }
      setDrag({ x: 0, y: 0 });
    }

    if (!g.moved && g.onImage) {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        if (scale > 1) resetView();
        else setScale(DOUBLE_TAP_SCALE);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }

    g.mode = "none";
    setGesturing(false);
  };

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !gesture.current.onImage && !gesture.current.moved) {
      onClose();
    }
  };

  const imageStyle: React.CSSProperties = {
    transform: `translate3d(${offset.x + drag.x}px, ${offset.y + drag.y}px, 0) scale(${scale})`,
    transition: gesturing ? "none" : "transform 0.2s ease",
    opacity: drag.y > 0 ? Math.max(0.4, 1 - drag.y / 400) : 1,
  };

  return (
    <div
      ref={stageRef}
      className={css.stage}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleStageClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        alt="Фото из чата"
        className={css.image}
        style={imageStyle}
        draggable={false}
      />
    </div>
  );
};

const ImageViewer = ({ photos, src, onChange, onClose }: IProps) => {
  const index = photos.indexOf(src);
  const total = photos.length;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const goTo = useCallback(
    (delta: number) => {
      const next = photos[index + delta];
      if (!next) return;
      setMessage(null);
      onChange(next);
    },
    [photos, index, onChange],
  );

  useEffect(() => {
    if (index === -1) onClose();
  }, [index, onClose]);

  useEffect(() => {
    for (const neighbour of [photos[index - 1], photos[index + 1]]) {
      if (neighbour) new Image().src = neighbour;
    }
  }, [photos, index]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goTo(-1);
      if (event.key === "ArrowRight") goTo(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, goTo]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const name = getFileName(src, blob.type);
      const file = new File([blob], name, { type: blob.type });

      if (isIOS()) {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
        } else {
          window.open(src, "_blank");
          setMessage("Удерживайте фото и выберите «Сохранить в Фото».");
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setMessage("Не удалось сохранить автоматически. Удерживайте фото, чтобы сохранить его.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className={css.overlay} role="dialog" aria-label="Просмотр фото">
      {total > 1 && (
        <span className={css.counter}>
          {index + 1} / {total}
        </span>
      )}

      <button type="button" className={css.closeBtn} onClick={onClose} aria-label="Закрыть">
        <X size={22} />
      </button>

      <PhotoStage key={src} src={src} onNavigate={goTo} onClose={onClose} />

      {index > 0 && (
        <button
          type="button"
          className={`${css.arrow} ${css.arrowLeft}`}
          onClick={() => goTo(-1)}
          aria-label="Предыдущее фото"
        >
          <ChevronLeft size={26} />
        </button>
      )}
      {index !== -1 && index < total - 1 && (
        <button
          type="button"
          className={`${css.arrow} ${css.arrowRight}`}
          onClick={() => goTo(1)}
          aria-label="Следующее фото"
        >
          <ChevronRight size={26} />
        </button>
      )}

      <div className={css.bar}>
        {message && <p className={css.message}>{message}</p>}
        <button type="button" className={css.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className={css.spin} /> : <Download size={18} />}
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default ImageViewer;
