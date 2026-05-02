"use client";

import type { FFmpeg as FFmpegInstance } from "@ffmpeg/ffmpeg";
import * as Slider from "@radix-ui/react-slider";
import {
  Camera,
  Clapperboard,
  Download,
  Loader2,
  Monitor,
  Music2,
  SlidersHorizontal,
  Square,
  Upload,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type OutputPresetId =
  | "youtube-shorts"
  | "tiktok"
  | "instagram-reels"
  | "youtube-landscape"
  | "square-post"
  | "custom";

type AspectRatioId = "9:16" | "16:9" | "1:1" | "4:5" | "custom";

type OutputPreset = {
  id: OutputPresetId;
  label: string;
  detail: string;
  helper: string;
  icon: LucideIcon;
  aspectRatio: AspectRatioId;
  width: number;
  height: number;
  recommendedMaxDuration?: number;
};

type CropMode = "fit" | "fill-crop" | "blurred-background";

type QualityId = "high" | "medium" | "low";

type ShortMakerState = {
  file: File | null;
  videoUrl: string | null;
  duration: number;
  startSecond: number;
  endSecond: number;
  selectedPresetId: OutputPresetId;
  aspectRatio: AspectRatioId;
  outputWidth: number;
  outputHeight: number;
  cropMode: CropMode;
  focalX: number;
  quality: QualityId;
  isFfmpegLoaded: boolean;
  isProcessing: boolean;
  progress: number;
  outputUrl: string | null;
  error: string | null;
};

const OUTPUT_PRESETS: OutputPreset[] = [
  {
    id: "youtube-shorts",
    label: "Shorts",
    detail: "9:16 · 1080×1920",
    helper: "Optimized for vertical short-form platforms.",
    icon: Clapperboard,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    recommendedMaxDuration: 60,
  },
  {
    id: "tiktok",
    label: "TikTok",
    detail: "9:16 · 1080×1920",
    helper: "Optimized for vertical short-form platforms.",
    icon: Music2,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    recommendedMaxDuration: 60,
  },
  {
    id: "instagram-reels",
    label: "Reels",
    detail: "9:16 · 1080×1920",
    helper: "Optimized for vertical short-form platforms.",
    icon: Camera,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    recommendedMaxDuration: 90,
  },
  {
    id: "youtube-landscape",
    label: "YouTube",
    detail: "16:9 · 1920×1080",
    helper: "Optimized for standard landscape video.",
    icon: Monitor,
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
  },
  {
    id: "square-post",
    label: "Square",
    detail: "1:1 · 1080×1080",
    helper: "Optimized for square social feeds.",
    icon: Square,
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },
  {
    id: "custom",
    label: "Custom",
    detail: "Manual",
    helper: "Set a custom output size.",
    icon: SlidersHorizontal,
    aspectRatio: "custom",
    width: 1080,
    height: 1920,
  },
];

const ASPECT_RATIO_OPTIONS: Array<{ id: AspectRatioId; label: string; width: number; height: number }> = [
  { id: "9:16", label: "9:16 vertical", width: 1080, height: 1920 },
  { id: "16:9", label: "16:9 landscape", width: 1920, height: 1080 },
  { id: "1:1", label: "1:1 square", width: 1080, height: 1080 },
  { id: "4:5", label: "4:5 portrait", width: 1080, height: 1350 },
  { id: "custom", label: "Custom", width: 1080, height: 1920 },
];

const CROP_MODE_COPY: Record<CropMode, { label: string; description: string }> = {
  fit: { label: "Fit", description: "Full video visible." },
  "fill-crop": { label: "Fill", description: "Fills frame, crops edges." },
  "blurred-background": { label: "Blur", description: "Full video, blurred BG." },
};

const QUALITY_OPTIONS: Array<{ id: QualityId; label: string; description: string }> = [
  { id: "high", label: "High", description: "Best quality, larger file." },
  { id: "medium", label: "Medium", description: "Balanced size and quality." },
  { id: "low", label: "Small file", description: "Smaller file, lower quality." },
];

const CRF_MAP: Record<QualityId, string> = { high: "20", medium: "26", low: "32" };

const DEFAULT_PRESET = OUTPUT_PRESETS[0];
const EXPORT_LEAVE_WARNING =
  "Export is still running. Leaving now will stop the render and you will need to export again.";

function getDefaultCropMode(preset: OutputPreset): CropMode {
  return preset.aspectRatio === "9:16" ? "blurred-background" : "fit";
}

const INITIAL_STATE: ShortMakerState = {
  file: null,
  videoUrl: null,
  duration: 0,
  startSecond: 0,
  endSecond: 0,
  selectedPresetId: DEFAULT_PRESET.id,
  aspectRatio: DEFAULT_PRESET.aspectRatio,
  outputWidth: DEFAULT_PRESET.width,
  outputHeight: DEFAULT_PRESET.height,
  cropMode: "blurred-background",
  focalX: 50,
  quality: "high",
  isFfmpegLoaded: false,
  isProcessing: false,
  progress: 0,
  outputUrl: null,
  error: null,
};

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
}

function clampTrim(startSecond: number, endSecond: number, duration: number) {
  const maxDuration = Math.max(0, duration);
  const safeStart = Math.min(Math.max(0, startSecond), Math.max(0, maxDuration - 0.1));
  const safeEnd = Math.min(Math.max(safeStart + 0.1, endSecond), maxDuration);
  return { startSecond: Number(safeStart.toFixed(1)), endSecond: Number(safeEnd.toFixed(1)) };
}

function getInputName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  return `input.${ext}`;
}

function toEvenDimension(value: number) {
  if (!Number.isFinite(value)) return 2;
  return Math.max(2, Math.floor(value / 2) * 2);
}

function getVideoFilter(cropMode: CropMode, width: number, height: number, focalX: number) {
  const fp = Math.min(1, Math.max(0, focalX / 100)).toFixed(3);
  if (cropMode === "fit") {
    return {
      flag: "-vf",
      value: `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    };
  }
  if (cropMode === "fill-crop") {
    return {
      flag: "-vf",
      value: `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-${width})*${fp}:(ih-${height})/2,setsar=1`,
    };
  }
  return {
    flag: "-filter_complex",
    value: `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-${width})*${fp}:(ih-${height})/2,boxblur=20:1[bg];[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`,
  };
}

function PresetsGrid({
  presets,
  selectedId,
  disabled,
  onSelect,
}: {
  presets: OutputPreset[];
  selectedId: OutputPresetId;
  disabled: boolean;
  onSelect: (p: OutputPreset) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {presets.map((preset) => {
        const Icon = preset.icon;
        const isSelected = preset.id === selectedId;
        return (
          <button
            key={preset.id}
            aria-pressed={isSelected}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-2 text-left text-xs transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-60",
              isSelected && "border-primary bg-primary/10 ring-1 ring-primary/20"
            )}
            disabled={disabled}
            onClick={() => onSelect(preset)}
            type="button"
          >
            <Icon className={cn("size-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("truncate font-semibold", isSelected && "text-primary")}>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleButtons<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: Array<{ id: T; label: string; description: string }>;
  value: T;
  disabled: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((opt) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            aria-pressed={isSelected}
            className={cn(
              "flex flex-col items-start rounded-xl border border-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-60",
              isSelected && "border-primary bg-primary/10 ring-1 ring-primary/20"
            )}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            type="button"
          >
            <span className={cn("text-xs font-semibold", isSelected && "text-primary")}>{opt.label}</span>
            <span className="text-[10px] leading-tight text-muted-foreground">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ShortMakerClient() {
  const [state, setState] = useState<ShortMakerState>(INITIAL_STATE);
  const [showOutput, setShowOutput] = useState(false);
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const selectedPreset = useMemo(
    () => OUTPUT_PRESETS.find((p) => p.id === state.selectedPresetId) ?? DEFAULT_PRESET,
    [state.selectedPresetId]
  );
  const selectedDuration = Math.max(0, state.endSecond - state.startSecond);
  const safeOutputWidth = toEvenDimension(state.outputWidth);
  const safeOutputHeight = toEvenDimension(state.outputHeight);
  const hasValidDimensions = state.outputWidth > 0 && state.outputHeight > 0;
  const hasOddDimensions = hasValidDimensions && (state.outputWidth % 2 !== 0 || state.outputHeight % 2 !== 0);
  const durationLimit = selectedPreset.recommendedMaxDuration;
  const isOverRecommendedDuration = Boolean(durationLimit && selectedDuration > durationLimit);
  const isLargeFile = Boolean(state.file && state.file.size > 500 * 1024 * 1024);
  const isExportDisabled = !state.file || selectedDuration <= 0 || !hasValidDimensions || state.isProcessing;
  const leaveWarning = useMemo(
    () => `${EXPORT_LEAVE_WARNING} Current progress: ${Math.round(state.progress)}%.`,
    [state.progress]
  );

  // Auto-switch preview to output when export finishes
  useEffect(() => {
    if (state.outputUrl) setShowOutput(true);
  }, [state.outputUrl]);

  const revokeVideoUrl = useCallback(() => {
    if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
  }, []);

  const revokeOutputUrl = useCallback(() => {
    if (outputUrlRef.current) { URL.revokeObjectURL(outputUrlRef.current); outputUrlRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    revokeVideoUrl();
    revokeOutputUrl();
    setShowOutput(false);
    setState((cur) => ({ ...INITIAL_STATE, isFfmpegLoaded: cur.isFfmpegLoaded }));
  }, [revokeOutputUrl, revokeVideoUrl]);

  useEffect(() => {
    return () => { revokeVideoUrl(); revokeOutputUrl(); ffmpegRef.current?.terminate(); };
  }, [revokeOutputUrl, revokeVideoUrl]);

  useEffect(() => {
    if (!state.isProcessing) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault(); e.returnValue = leaveWarning; return leaveWarning;
    };
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(leaveWarning)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [leaveWarning, state.isProcessing]);

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setState((cur) => ({ ...cur, error: "Unsupported file type. Choose a video file." }));
      return;
    }
    revokeVideoUrl(); revokeOutputUrl();
    const videoUrl = URL.createObjectURL(file);
    videoUrlRef.current = videoUrl;
    setShowOutput(false);
    setState((cur) => ({ ...cur, file, videoUrl, duration: 0, startSecond: 0, endSecond: 0, progress: 0, outputUrl: null, error: null }));
  }, [revokeOutputUrl, revokeVideoUrl]);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      setState((cur) => ({ ...cur, error: "Unsupported file type. Choose a video file." }));
      return;
    }
    const [file] = accepted;
    if (file) selectFile(file);
  }, [selectFile]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "video/*": [] }, disabled: state.isProcessing, maxFiles: 1, multiple: false, onDrop,
  });

  const onMetadataLoaded = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      setState((cur) => ({ ...cur, error: "Could not read the video duration." })); return;
    }
    setState((cur) => ({ ...cur, duration, startSecond: 0, endSecond: Math.min(60, duration), error: null }));
  }, []);

  const updateOutputSettings = useCallback((next: Partial<ShortMakerState>) => {
    revokeOutputUrl();
    setState((cur) => ({ ...cur, ...next, outputUrl: null, progress: cur.isProcessing ? cur.progress : 0 }));
  }, [revokeOutputUrl]);

  const selectPreset = useCallback((preset: OutputPreset) => {
    updateOutputSettings({
      selectedPresetId: preset.id, aspectRatio: preset.aspectRatio,
      outputWidth: preset.width, outputHeight: preset.height, cropMode: getDefaultCropMode(preset),
    });
  }, [updateOutputSettings]);

  const selectAspectRatio = useCallback((aspectRatio: AspectRatioId) => {
    const dims = ASPECT_RATIO_OPTIONS.find((o) => o.id === aspectRatio);
    updateOutputSettings({
      aspectRatio,
      outputWidth: dims && aspectRatio !== "custom" ? dims.width : state.outputWidth,
      outputHeight: dims && aspectRatio !== "custom" ? dims.height : state.outputHeight,
    });
  }, [state.outputHeight, state.outputWidth, updateOutputSettings]);

  const setTrimRange = useCallback((range: number[]) => {
    setState((cur) => {
      const [s = cur.startSecond, e = cur.endSecond] = range;
      return { ...cur, ...clampTrim(s, e, cur.duration), outputUrl: null };
    });
    revokeOutputUrl();
  }, [revokeOutputUrl]);

  const setTrimValue = useCallback((key: "startSecond" | "endSecond", value: number) => {
    setState((cur) => {
      const next = clampTrim(
        key === "startSecond" ? value : cur.startSecond,
        key === "endSecond" ? value : cur.endSecond,
        cur.duration
      );
      return { ...cur, ...next, outputUrl: null };
    });
    revokeOutputUrl();
  }, [revokeOutputUrl]);

  const ensureFfmpeg = useCallback(async () => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;
    setState((cur) => ({ ...cur, progress: 4, error: null }));
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      setState((cur) => ({ ...cur, progress: Math.max(cur.progress, Math.min(95, 20 + Math.round(progress * 75))) }));
    });
    const base = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    ]);
    await ffmpeg.load({ coreURL, wasmURL });
    ffmpegRef.current = ffmpeg;
    setState((cur) => ({ ...cur, isFfmpegLoaded: true, progress: Math.max(cur.progress, 20) }));
    return ffmpeg;
  }, []);

  const exportShort = useCallback(async () => {
    if (!state.file || selectedDuration <= 0 || !hasValidDimensions) return;
    revokeOutputUrl();
    setState((cur) => ({ ...cur, isProcessing: true, progress: 1, outputUrl: null, error: null }));

    const inputName = getInputName(state.file);
    const outputName = `${state.selectedPresetId}-export.mp4`;
    const filter = getVideoFilter(state.cropMode, safeOutputWidth, safeOutputHeight, state.focalX);
    let ffmpeg: FFmpegInstance | null = null;

    const buildArgs = (codec: "libx264" | "mpeg4") => [
      "-i", inputName,
      "-ss", state.startSecond.toFixed(2),
      "-to", state.endSecond.toFixed(2),
      filter.flag, filter.value,
      "-c:v", codec,
      ...(codec === "libx264" ? ["-pix_fmt", "yuv420p", "-crf", CRF_MAP[state.quality]] : ["-q:v", "4"]),
      "-c:a", "aac", "-movflags", "faststart", outputName,
    ];

    try {
      ffmpeg = await ensureFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");
      await ffmpeg.writeFile(inputName, await fetchFile(state.file));
      let exitCode = await ffmpeg.exec(buildArgs("libx264"));
      if (exitCode !== 0) { await ffmpeg.deleteFile(outputName).catch(() => undefined); exitCode = await ffmpeg.exec(buildArgs("mpeg4")); }
      if (exitCode !== 0) throw new Error("FFmpeg could not export the selected clip.");
      const outputData = await ffmpeg.readFile(outputName);
      const outputBlob = typeof outputData === "string"
        ? new Blob([outputData], { type: "video/mp4" })
        : new Blob([new Uint8Array(outputData).buffer], { type: "video/mp4" });
      const outputUrl = URL.createObjectURL(outputBlob);
      outputUrlRef.current = outputUrl;
      setState((cur) => ({ ...cur, isProcessing: false, progress: 100, outputUrl, error: null }));
    } catch (error) {
      setState((cur) => ({
        ...cur, isProcessing: false, progress: 0,
        error: error instanceof Error ? error.message : "Export failed. Try a different video file.",
      }));
    } finally {
      if (ffmpeg) await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
    }
  }, [
    ensureFfmpeg, hasValidDimensions, revokeOutputUrl,
    safeOutputHeight, safeOutputWidth, selectedDuration,
    state.cropMode, state.endSecond, state.file, state.focalX,
    state.quality, state.selectedPresetId, state.startSecond,
  ]);

  const downloadName = `${state.selectedPresetId}-export.mp4`;
  const activeVideoUrl = showOutput && state.outputUrl ? state.outputUrl : state.videoUrl;

  return (
    <AppShell>
      <main className="flex w-full flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Short Maker</h1>
            <p className="text-xs text-muted-foreground">
              {state.file
                ? `${safeOutputWidth}×${safeOutputHeight} · ${formatDuration(selectedDuration)} · ${selectedPreset.label}`
                : "Drop a video to get started"}
            </p>
          </div>
        </div>

        {/* Two-panel body — fills remaining height, no page scroll */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">

          {/* Left — video preview, stretches to fill height */}
          <Card className="flex min-h-0 flex-col overflow-hidden md:w-[55%] md:shrink-0">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base">
                {showOutput && state.outputUrl ? "Result" : "Preview"}
              </CardTitle>
              <CardDescription className="truncate text-xs">
                {state.outputUrl && showOutput
                  ? `${downloadName} · ready to download`
                  : state.file
                  ? state.file.name
                  : "Choose a local video file."}
              </CardDescription>
              {(state.file || state.outputUrl) && (
                <CardAction className="flex items-center gap-1.5">
                  {state.outputUrl && (
                    <Button
                      size="xs" type="button" variant="outline"
                      onClick={() => setShowOutput((v) => !v)}
                    >
                      {showOutput ? "View original" : "View result"}
                    </Button>
                  )}
                  {!state.outputUrl && (
                    <Button disabled={state.isProcessing} onClick={open} size="xs" type="button" variant="outline">
                      Replace
                    </Button>
                  )}
                  <Button disabled={state.isProcessing} onClick={reset} size="xs" type="button" variant="ghost">
                    Reset
                  </Button>
                </CardAction>
              )}
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              {!activeVideoUrl ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex min-h-40 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/30 px-5 text-center transition-colors hover:bg-muted/50",
                    isDragActive && "border-primary bg-primary/10",
                    state.isProcessing && "pointer-events-none opacity-60"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex size-10 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <Upload />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop the video here" : "Drop a video here or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, WebM, and browser-readable video files</p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-muted">
                  <input {...getInputProps()} />
                  <video
                    key={activeVideoUrl}
                    className="h-full w-full object-contain"
                    controls
                    onLoadedMetadata={!showOutput ? onMetadataLoaded : undefined}
                    src={activeVideoUrl}
                  />
                </div>
              )}

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(state.duration)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {safeOutputWidth}×{safeOutputHeight}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {state.aspectRatio}
                </Badge>
                {isLargeFile && (
                  <Badge variant="outline" className="text-xs">Large file</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right — settings panel, scrolls internally */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">

            {/* Format */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Format</CardTitle>
                <CardDescription className="text-xs">{selectedPreset.label} · {selectedPreset.detail}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Platform</p>
                  <PresetsGrid
                    presets={OUTPUT_PRESETS}
                    selectedId={state.selectedPresetId}
                    disabled={state.isProcessing}
                    onSelect={selectPreset}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Fit mode</p>
                  <ToggleButtons
                    options={Object.entries(CROP_MODE_COPY).map(([id, v]) => ({ id: id as CropMode, ...v }))}
                    value={state.cropMode}
                    disabled={state.isProcessing}
                    onChange={(mode) => updateOutputSettings({ cropMode: mode })}
                  />
                </div>

                {state.cropMode !== "fit" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Focal point</p>
                      <span className="text-xs text-muted-foreground">{state.focalX}%</span>
                    </div>
                    <Slider.Root
                      aria-label="Focal point"
                      className="relative flex h-5 w-full touch-none select-none items-center"
                      disabled={state.isProcessing}
                      max={100} min={0}
                      onValueChange={([v]) => updateOutputSettings({ focalX: v ?? 50 })}
                      step={1}
                      value={[state.focalX]}
                    >
                      <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
                        <Slider.Range className="absolute h-full rounded-full bg-primary" />
                      </Slider.Track>
                      <Slider.Thumb className="block size-4 rounded-full border border-border bg-background shadow-sm outline-none ring-ring transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50" />
                    </Slider.Root>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>← Left</span><span>Right →</span>
                    </div>
                  </div>
                )}

                {state.selectedPresetId === "custom" && (
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/30 p-3">
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Ratio
                      <select
                        className="h-8 rounded-xl border border-transparent bg-input/50 px-2 text-xs outline-none focus-visible:border-ring"
                        disabled={state.isProcessing}
                        onChange={(e) => selectAspectRatio(e.target.value as AspectRatioId)}
                        value={state.aspectRatio}
                      >
                        {ASPECT_RATIO_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Width
                      <Input disabled={state.isProcessing} min={2} step={2} type="number"
                        value={state.outputWidth}
                        onChange={(e) => updateOutputSettings({ outputWidth: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      Height
                      <Input disabled={state.isProcessing} min={2} step={2} type="number"
                        value={state.outputHeight}
                        onChange={(e) => updateOutputSettings({ outputHeight: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </label>
                  </div>
                )}

                {!hasValidDimensions && (
                  <Badge variant="destructive" className="h-auto w-fit whitespace-normal px-3 py-1 text-xs">
                    Width and height must be positive numbers.
                  </Badge>
                )}
                {hasOddDimensions && (
                  <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1 text-xs">
                    Exports as {safeOutputWidth}×{safeOutputHeight}.
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Trim */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Trim</CardTitle>
                <CardAction>
                  <Badge variant="secondary" className="text-xs">{formatDuration(selectedDuration)}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDuration(state.startSecond)}</span>
                  <span>{formatDuration(state.duration)}</span>
                </div>
                <Slider.Root
                  aria-label="Trim range"
                  className="relative flex h-5 w-full touch-none select-none items-center"
                  disabled={!state.file || state.duration <= 0 || state.isProcessing}
                  max={Math.max(0.1, state.duration)} min={0}
                  minStepsBetweenThumbs={1}
                  onValueChange={setTrimRange} step={0.1}
                  value={[state.startSecond, state.endSecond]}
                >
                  <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
                    <Slider.Range className="absolute h-full rounded-full bg-primary" />
                  </Slider.Track>
                  <Slider.Thumb className="block size-4 rounded-full border border-border bg-background shadow-sm outline-none ring-ring transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50" />
                  <Slider.Thumb className="block size-4 rounded-full border border-border bg-background shadow-sm outline-none ring-ring transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50" />
                </Slider.Root>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Start
                    <Input disabled={!state.file || state.isProcessing} max={state.endSecond - 0.1} min={0}
                      onChange={(e) => setTrimValue("startSecond", Number(e.target.value))}
                      step={0.1} type="number" value={state.startSecond} className="h-8 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    End
                    <Input disabled={!state.file || state.isProcessing} max={state.duration} min={state.startSecond + 0.1}
                      onChange={(e) => setTrimValue("endSecond", Number(e.target.value))}
                      step={0.1} type="number" value={state.endSecond} className="h-8 text-xs"
                    />
                  </label>
                </div>
                {isOverRecommendedDuration && durationLimit && (
                  <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1 text-xs">
                    Recommended up to {durationLimit}s.
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Export */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Export</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Quality</p>
                  <ToggleButtons
                    options={QUALITY_OPTIONS}
                    value={state.quality}
                    disabled={state.isProcessing}
                    onChange={(q) => setState((p) => ({ ...p, quality: q, outputUrl: null }))}
                  />
                </div>

                <Button className="w-full" disabled={isExportDisabled} onClick={exportShort}>
                  {state.isProcessing
                    ? <Loader2 data-icon="inline-start" className="animate-spin" />
                    : <Wand2 data-icon="inline-start" />}
                  {state.isProcessing ? "Exporting…" : "Export MP4"}
                </Button>

                {(state.isProcessing || (state.progress > 0 && state.progress < 100)) && (
                  <div className="flex flex-col gap-1">
                    <Progress value={state.progress} />
                    <p className="text-xs text-muted-foreground">
                      {state.isFfmpegLoaded ? `Processing ${Math.round(state.progress)}%` : "Loading FFmpeg…"}
                    </p>
                  </div>
                )}

                {state.error && (
                  <Badge variant="destructive" className="h-auto w-fit max-w-full whitespace-normal px-3 py-1 text-xs">
                    {state.error}
                  </Badge>
                )}

                {state.outputUrl && (
                  <Button
                    className="w-full"
                    nativeButton={false}
                    render={<a href={state.outputUrl} download={downloadName} />}
                    variant="secondary"
                  >
                    <Download data-icon="inline-start" />
                    Download MP4
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">
                  Processed locally — your video never leaves your device.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </AppShell>
  );
}
