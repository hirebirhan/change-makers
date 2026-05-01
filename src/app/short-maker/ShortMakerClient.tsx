"use client";

import type { FFmpeg as FFmpegInstance } from "@ffmpeg/ffmpeg";
import * as Slider from "@radix-ui/react-slider";
import {
  Download,
  Camera,
  Clapperboard,
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
    detail: "9:16 · 1080x1920",
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
    detail: "9:16 · 1080x1920",
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
    detail: "9:16 · 1080x1920",
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
    detail: "16:9 · 1920x1080",
    helper: "Optimized for standard landscape video.",
    icon: Monitor,
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
  },
  {
    id: "square-post",
    label: "Square",
    detail: "1:1 · 1080x1080",
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
  fit: {
    label: "Fit",
    description: "Keeps the full video visible.",
  },
  "fill-crop": {
    label: "Fill",
    description: "Fills the frame and may crop edges.",
  },
  "blurred-background": {
    label: "Blur",
    description: "Keeps full video with a blurred background.",
  },
};

const DEFAULT_PRESET = OUTPUT_PRESETS[0];
const EXPORT_LEAVE_WARNING = "Export is still running. Leaving now will stop the render and you will need to export again.";

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
  isFfmpegLoaded: false,
  isProcessing: false,
  progress: 0,
  outputUrl: null,
  error: null,
};

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function clampTrim(startSecond: number, endSecond: number, duration: number) {
  const maxDuration = Math.max(0, duration);
  const safeStart = Math.min(Math.max(0, startSecond), Math.max(0, maxDuration - 0.1));
  const safeEnd = Math.min(Math.max(safeStart + 0.1, endSecond), maxDuration);

  return {
    startSecond: Number(safeStart.toFixed(1)),
    endSecond: Number(safeEnd.toFixed(1)),
  };
}

function getInputName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  return `input.${extension}`;
}

function toEvenDimension(value: number) {
  if (!Number.isFinite(value)) return 2;
  return Math.max(2, Math.floor(value / 2) * 2);
}

function getVideoFilter(cropMode: CropMode, width: number, height: number) {
  if (cropMode === "fit") {
    return {
      flag: "-vf",
      value: `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    };
  }

  if (cropMode === "fill-crop") {
    return {
      flag: "-vf",
      value: `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`,
    };
  }

  return {
    flag: "-filter_complex",
    value: `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=20:1[bg];[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`,
  };
}

export function ShortMakerClient() {
  const [state, setState] = useState<ShortMakerState>(INITIAL_STATE);
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const selectedPreset = useMemo(
    () => OUTPUT_PRESETS.find((preset) => preset.id === state.selectedPresetId) ?? DEFAULT_PRESET,
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

  const revokeVideoUrl = useCallback(() => {
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
  }, []);

  const revokeOutputUrl = useCallback(() => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    revokeVideoUrl();
    revokeOutputUrl();
    setState((current) => ({
      ...INITIAL_STATE,
      isFfmpegLoaded: current.isFfmpegLoaded,
    }));
  }, [revokeOutputUrl, revokeVideoUrl]);

  useEffect(() => {
    return () => {
      revokeVideoUrl();
      revokeOutputUrl();
      ffmpegRef.current?.terminate();
    };
  }, [revokeOutputUrl, revokeVideoUrl]);

  useEffect(() => {
    if (!state.isProcessing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = leaveWarning;
      return leaveWarning;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      if (!window.confirm(leaveWarning)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [leaveWarning, state.isProcessing]);

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setState((current) => ({
        ...current,
        error: "Unsupported file type. Choose a video file.",
      }));
      return;
    }

    revokeVideoUrl();
    revokeOutputUrl();

    const videoUrl = URL.createObjectURL(file);
    videoUrlRef.current = videoUrl;

    setState((current) => ({
      ...current,
      file,
      videoUrl,
      duration: 0,
      startSecond: 0,
      endSecond: 0,
      progress: 0,
      outputUrl: null,
      error: null,
    }));
  }, [revokeOutputUrl, revokeVideoUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setState((current) => ({
          ...current,
          error: "Unsupported file type. Choose a video file.",
        }));
        return;
      }

      const [file] = acceptedFiles;
      if (file) selectFile(file);
    },
    [selectFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "video/*": [] },
    disabled: state.isProcessing,
    maxFiles: 1,
    multiple: false,
    onDrop,
  });

  const onMetadataLoaded = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = event.currentTarget.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      setState((current) => ({
        ...current,
        error: "Could not read the video duration.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      duration,
      startSecond: 0,
      endSecond: Math.min(60, duration),
      error: null,
    }));
  }, []);

  const updateOutputSettings = useCallback((nextState: Partial<ShortMakerState>) => {
    revokeOutputUrl();
    setState((current) => ({
      ...current,
      ...nextState,
      outputUrl: null,
      progress: current.isProcessing ? current.progress : 0,
    }));
  }, [revokeOutputUrl]);

  const selectPreset = useCallback((preset: OutputPreset) => {
    updateOutputSettings({
      selectedPresetId: preset.id,
      aspectRatio: preset.aspectRatio,
      outputWidth: preset.width,
      outputHeight: preset.height,
      cropMode: getDefaultCropMode(preset),
    });
  }, [updateOutputSettings]);

  const selectAspectRatio = useCallback((aspectRatio: AspectRatioId) => {
    const dimensions = ASPECT_RATIO_OPTIONS.find((option) => option.id === aspectRatio);
    updateOutputSettings({
      aspectRatio,
      outputWidth: dimensions && aspectRatio !== "custom" ? dimensions.width : state.outputWidth,
      outputHeight: dimensions && aspectRatio !== "custom" ? dimensions.height : state.outputHeight,
    });
  }, [state.outputHeight, state.outputWidth, updateOutputSettings]);

  const setTrimRange = useCallback((nextRange: number[]) => {
    setState((current) => {
      const [nextStart = current.startSecond, nextEnd = current.endSecond] = nextRange;
      return {
        ...current,
        ...clampTrim(nextStart, nextEnd, current.duration),
        outputUrl: null,
      };
    });
    revokeOutputUrl();
  }, [revokeOutputUrl]);

  const setTrimValue = useCallback((key: "startSecond" | "endSecond", value: number) => {
    setState((current) => {
      const nextTrim = clampTrim(
        key === "startSecond" ? value : current.startSecond,
        key === "endSecond" ? value : current.endSecond,
        current.duration
      );

      return {
        ...current,
        ...nextTrim,
        outputUrl: null,
      };
    });
    revokeOutputUrl();
  }, [revokeOutputUrl]);

  const ensureFfmpeg = useCallback(async () => {
    if (ffmpegRef.current?.loaded) {
      return ffmpegRef.current;
    }

    setState((current) => ({
      ...current,
      progress: 4,
      error: null,
    }));

    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);

    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      setState((current) => ({
        ...current,
        progress: Math.max(current.progress, Math.min(95, 20 + Math.round(progress * 75))),
      }));
    });

    const coreBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm"),
    ]);

    await ffmpeg.load({ coreURL, wasmURL });
    ffmpegRef.current = ffmpeg;

    setState((current) => ({
      ...current,
      isFfmpegLoaded: true,
      progress: Math.max(current.progress, 20),
    }));

    return ffmpeg;
  }, []);

  const exportShort = useCallback(async () => {
    if (!state.file || selectedDuration <= 0 || !hasValidDimensions) return;

    revokeOutputUrl();
    setState((current) => ({
      ...current,
      isProcessing: true,
      progress: 1,
      outputUrl: null,
      error: null,
    }));

    const inputName = getInputName(state.file);
    const outputName = `${state.selectedPresetId}-export.mp4`;
    const filter = getVideoFilter(state.cropMode, safeOutputWidth, safeOutputHeight);
    let ffmpeg: FFmpegInstance | null = null;

    const buildArgs = (codec: "libx264" | "mpeg4") => [
      "-i",
      inputName,
      "-ss",
      state.startSecond.toFixed(2),
      "-to",
      state.endSecond.toFixed(2),
      filter.flag,
      filter.value,
      "-c:v",
      codec,
      ...(codec === "libx264" ? ["-pix_fmt", "yuv420p"] : ["-q:v", "4"]),
      "-c:a",
      "aac",
      "-movflags",
      "faststart",
      outputName,
    ];

    try {
      ffmpeg = await ensureFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");

      await ffmpeg.writeFile(inputName, await fetchFile(state.file));

      let exitCode = await ffmpeg.exec(buildArgs("libx264"));
      if (exitCode !== 0) {
        await ffmpeg.deleteFile(outputName).catch(() => undefined);
        exitCode = await ffmpeg.exec(buildArgs("mpeg4"));
      }

      if (exitCode !== 0) {
        throw new Error("FFmpeg could not export the selected clip.");
      }

      const outputData = await ffmpeg.readFile(outputName);
      const outputBlob =
        typeof outputData === "string"
          ? new Blob([outputData], { type: "video/mp4" })
          : new Blob([new Uint8Array(outputData).buffer], { type: "video/mp4" });
      const outputUrl = URL.createObjectURL(outputBlob);
      outputUrlRef.current = outputUrl;

      setState((current) => ({
        ...current,
        isProcessing: false,
        progress: 100,
        outputUrl,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Export failed. Try a different video file.",
      }));
    } finally {
      if (ffmpeg) {
        await Promise.allSettled([
          ffmpeg.deleteFile(inputName),
          ffmpeg.deleteFile(outputName),
        ]);
      }
    }
  }, [
    ensureFfmpeg,
    hasValidDimensions,
    revokeOutputUrl,
    safeOutputHeight,
    safeOutputWidth,
    selectedDuration,
    state.cropMode,
    state.endSecond,
    state.file,
    state.selectedPresetId,
    state.startSecond,
  ]);

  const downloadName = `${state.selectedPresetId}-export.mp4`;

  return (
    <AppShell>
      <main className="flex w-full flex-1 flex-col gap-3 overflow-x-hidden px-4 py-4">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Video Format Studio</h1>
            <p className="text-xs text-muted-foreground">Processed locally in your browser. Large videos may take longer.</p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 md:items-end">
            <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
              <label className="sr-only" htmlFor="layout-mode">
                Layout
              </label>
              <select
                className="h-9 min-w-28 flex-1 rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 min-[420px]:flex-none"
                disabled={state.isProcessing}
                id="layout-mode"
                onChange={(event) => updateOutputSettings({ cropMode: event.target.value as CropMode })}
                value={state.cropMode}
              >
                {(Object.keys(CROP_MODE_COPY) as CropMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {CROP_MODE_COPY[mode].label}
                  </option>
                ))}
              </select>

              <Button className="flex-1 min-[420px]:flex-none" disabled={isExportDisabled} onClick={exportShort}>
                {state.isProcessing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Wand2 data-icon="inline-start" />}
                {state.isProcessing ? "Exporting" : "Export MP4"}
              </Button>

              {state.outputUrl && (
                <Button
                  className="flex-1 min-[420px]:flex-none"
                  nativeButton={false}
                  render={<a href={state.outputUrl} download={downloadName} />}
                  variant="secondary"
                >
                  <Download data-icon="inline-start" />
                  Download
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground md:text-right">
              {selectedPreset.label} · {safeOutputWidth}x{safeOutputHeight} · {formatDuration(selectedDuration)} · {CROP_MODE_COPY[state.cropMode].label}
            </p>
          </div>
        </div>

        {state.isProcessing && (
          <div className="flex flex-col gap-1">
            <Progress value={state.progress} />
            <p className="text-xs text-muted-foreground">
              {state.isFfmpegLoaded ? `Processing ${Math.round(state.progress)}%` : "Loading FFmpeg"}
            </p>
          </div>
        )}

        {state.error && (
          <Badge variant="destructive" className="h-auto w-fit max-w-full whitespace-normal px-3 py-1.5 text-xs">
            {state.error}
          </Badge>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <Card size="sm" className="min-w-0 gap-3 xl:col-start-1 xl:row-start-1">
            <CardHeader className="min-w-0">
              <CardTitle>Upload / Preview</CardTitle>
              <CardDescription className="truncate">
                {state.file ? state.file.name : "Choose a local video file."}
              </CardDescription>
              {state.file && (
                <CardAction className="flex items-center gap-2">
                  <Button disabled={state.isProcessing} onClick={open} size="xs" type="button" variant="outline">
                    Replace
                  </Button>
                  <Button disabled={state.isProcessing} onClick={reset} size="xs" type="button" variant="ghost">
                    Reset
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!state.videoUrl ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center transition-colors hover:bg-muted/50",
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
                <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl bg-muted">
                  <input {...getInputProps()} />
                  <video
                    className="h-full w-full object-contain"
                    controls
                    onLoadedMetadata={onMetadataLoaded}
                    src={state.videoUrl}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Duration {formatDuration(state.duration)}</Badge>
                <Badge variant="secondary">{safeOutputWidth}x{safeOutputHeight}</Badge>
                <Badge variant="secondary">{state.aspectRatio}</Badge>
              </div>

              {isLargeFile && (
                <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1.5 text-xs">
                  Large videos may take longer.
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card size="sm" className="min-w-0 gap-3 xl:col-start-2 xl:row-start-1">
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>{selectedPreset.label} · {selectedPreset.detail}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-2">
                {OUTPUT_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = preset.id === state.selectedPresetId;
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={cn(
                        "flex min-w-0 items-center gap-2 rounded-3xl border border-border bg-background p-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-60",
                        isSelected && "border-primary bg-primary/10 ring-1 ring-primary/20"
                      )}
                      disabled={state.isProcessing}
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      type="button"
                    >
                      <Icon className={cn("size-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold">{preset.label}</span>
                        <span className="truncate text-xs text-muted-foreground">{preset.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">{selectedPreset.helper}</p>

              {state.selectedPresetId === "custom" && (
                <div className="grid grid-cols-1 gap-2 rounded-3xl bg-muted/30 p-3 sm:grid-cols-3 xl:grid-cols-1">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Aspect ratio
                    <select
                      className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                      disabled={state.isProcessing}
                      onChange={(event) => selectAspectRatio(event.target.value as AspectRatioId)}
                      value={state.aspectRatio}
                    >
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Width
                    <Input
                      disabled={state.isProcessing}
                      min={2}
                      onChange={(event) => updateOutputSettings({ outputWidth: Number(event.target.value) })}
                      step={2}
                      type="number"
                      value={state.outputWidth}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Height
                    <Input
                      disabled={state.isProcessing}
                      min={2}
                      onChange={(event) => updateOutputSettings({ outputHeight: Number(event.target.value) })}
                      step={2}
                      type="number"
                      value={state.outputHeight}
                    />
                  </label>
                </div>
              )}

              {!hasValidDimensions && (
                <Badge variant="destructive" className="h-auto w-fit whitespace-normal px-3 py-1.5 text-xs">
                  Width and height must be positive numbers.
                </Badge>
              )}

              {hasOddDimensions && (
                <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1.5 text-xs">
                  Exports as {safeOutputWidth}x{safeOutputHeight}.
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card size="sm" className="min-w-0 gap-3 xl:col-start-1 xl:row-start-2">
            <CardHeader>
              <CardTitle>Trim</CardTitle>
              <CardAction>
                <Badge variant="secondary">{formatDuration(selectedDuration)}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{formatDuration(state.startSecond)}</span>
                <span>{formatDuration(state.duration)}</span>
              </div>

              <Slider.Root
                aria-label="Trim range"
                className="relative flex h-6 w-full touch-none select-none items-center"
                disabled={!state.file || state.duration <= 0 || state.isProcessing}
                max={Math.max(0.1, state.duration)}
                min={0}
                minStepsBetweenThumbs={1}
                onValueChange={setTrimRange}
                step={0.1}
                value={[state.startSecond, state.endSecond]}
              >
                <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-muted">
                  <Slider.Range className="absolute h-full rounded-full bg-primary" />
                </Slider.Track>
                <Slider.Thumb className="block size-5 rounded-full border border-border bg-background shadow-sm outline-none ring-ring transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50" />
                <Slider.Thumb className="block size-5 rounded-full border border-border bg-background shadow-sm outline-none ring-ring transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50" />
              </Slider.Root>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Start
                  <Input
                    disabled={!state.file || state.isProcessing}
                    max={state.endSecond - 0.1}
                    min={0}
                    onChange={(event) => setTrimValue("startSecond", Number(event.target.value))}
                    step={0.1}
                    type="number"
                    value={state.startSecond}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  End
                  <Input
                    disabled={!state.file || state.isProcessing}
                    max={state.duration}
                    min={state.startSecond + 0.1}
                    onChange={(event) => setTrimValue("endSecond", Number(event.target.value))}
                    step={0.1}
                    type="number"
                    value={state.endSecond}
                  />
                </label>
              </div>

              {isOverRecommendedDuration && durationLimit && (
                <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1.5 text-xs">
                  Recommended up to {durationLimit} seconds.
                </Badge>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </AppShell>
  );
}
