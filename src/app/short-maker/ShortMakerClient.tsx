"use client";

import type { FFmpeg as FFmpegInstance } from "@ffmpeg/ffmpeg";
import * as Slider from "@radix-ui/react-slider";
import { Download, FileVideo, Loader2, RotateCcw, Upload, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CropMode = "center-crop" | "blurred-background";

type ShortMakerState = {
  file: File | null;
  videoUrl: string | null;
  duration: number;
  startSecond: number;
  endSecond: number;
  cropMode: CropMode;
  isFfmpegLoaded: boolean;
  isProcessing: boolean;
  progress: number;
  outputUrl: string | null;
  error: string | null;
};

const INITIAL_STATE: ShortMakerState = {
  file: null,
  videoUrl: null,
  duration: 0,
  startSecond: 0,
  endSecond: 0,
  cropMode: "center-crop",
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

export function ShortMakerClient() {
  const [state, setState] = useState<ShortMakerState>(INITIAL_STATE);
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const selectedDuration = Math.max(0, state.endSecond - state.startSecond);
  const isExportDisabled = !state.file || selectedDuration <= 0 || state.isProcessing;
  const isOverShortLimit = selectedDuration > 60;

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
    if (!state.file || selectedDuration <= 0) return;

    revokeOutputUrl();
    setState((current) => ({
      ...current,
      isProcessing: true,
      progress: 1,
      outputUrl: null,
      error: null,
    }));

    const inputName = getInputName(state.file);
    const outputName = "short-maker-output.mp4";
    let ffmpeg: FFmpegInstance | null = null;

    try {
      ffmpeg = await ensureFfmpeg();
      const { fetchFile } = await import("@ffmpeg/util");
      const filterArgs =
        state.cropMode === "center-crop"
          ? ["-vf", "crop=ih*9/16:ih,scale=1080:1920,setsar=1"]
          : [
              "-filter_complex",
              "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:1[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1",
            ];

      await ffmpeg.writeFile(inputName, await fetchFile(state.file));

      const exitCode = await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        state.startSecond.toFixed(2),
        "-t",
        selectedDuration.toFixed(2),
        ...filterArgs,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "faststart",
        outputName,
      ]);

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
    revokeOutputUrl,
    selectedDuration,
    state.cropMode,
    state.file,
    state.startSecond,
  ]);

  const downloadName = useMemo(() => {
    if (!state.file) return "youtube-short.mp4";
    const baseName = state.file.name.replace(/\.[^.]+$/, "") || "youtube-short";
    return `${baseName}-short.mp4`;
  }, [state.file]);

  return (
    <AppShell>
      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Short Maker</h1>
          <p className="text-sm text-muted-foreground">
            Create a vertical Short from a local video in your browser.
          </p>
        </div>

        {state.error && (
          <Badge variant="destructive" className="h-auto w-fit max-w-full whitespace-normal px-3 py-1.5 text-xs">
            {state.error}
          </Badge>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Upload</CardTitle>
                <CardDescription>Choose a local video file. Processing stays in this browser tab.</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:bg-muted/50",
                    isDragActive && "border-primary bg-primary/10",
                    state.isProcessing && "pointer-events-none opacity-60"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <Upload />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop the video here" : "Drop a video here or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, WebM, and other browser-readable video files</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {state.file ? state.file.name : "Upload a video to choose a clip."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl bg-muted">
                  {state.videoUrl ? (
                    <video
                      className="h-full w-full object-contain"
                      controls
                      onLoadedMetadata={onMetadataLoaded}
                      src={state.videoUrl}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileVideo />
                      <span className="text-sm">No video selected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Trim</CardTitle>
                <CardDescription>
                  Selected duration: {formatDuration(selectedDuration)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
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

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Start
                    <Input
                      disabled={!state.file || state.isProcessing}
                      min={0}
                      max={state.endSecond - 0.1}
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
                      min={state.startSecond + 0.1}
                      max={state.duration}
                      onChange={(event) => setTrimValue("endSecond", Number(event.target.value))}
                      step={0.1}
                      type="number"
                      value={state.endSecond}
                    />
                  </label>
                </div>

                {isOverShortLimit && (
                  <Badge variant="outline" className="h-auto w-fit whitespace-normal px-3 py-1.5 text-xs">
                    Shorts are usually 60 seconds or less. Export is still available.
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Crop Mode</CardTitle>
                <CardDescription>Export as a vertical 1080x1920 MP4.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={state.cropMode}
                  onValueChange={(value) => {
                    revokeOutputUrl();
                    setState((current) => ({
                      ...current,
                      cropMode: value as CropMode,
                      outputUrl: null,
                    }));
                  }}
                >
                  <TabsList className="grid h-auto w-full grid-cols-2">
                    <TabsTrigger disabled={state.isProcessing} value="center-crop" className="h-8 text-xs">
                      Center crop
                    </TabsTrigger>
                    <TabsTrigger disabled={state.isProcessing} value="blurred-background" className="h-8 text-xs">
                      Blurred background
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                <Button disabled={isExportDisabled} onClick={exportShort}>
                  {state.isProcessing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Wand2 data-icon="inline-start" />}
                  {state.isProcessing ? "Exporting" : "Export Short"}
                </Button>

                {(state.isProcessing || state.progress > 0) && (
                  <div className="flex flex-col gap-2">
                    <Progress value={state.progress} />
                    <p className="text-xs text-muted-foreground">
                      {state.isProcessing
                        ? state.isFfmpegLoaded
                          ? `Processing video ${Math.round(state.progress)}%`
                          : "Loading FFmpeg"
                        : `Export complete ${Math.round(state.progress)}%`}
                    </p>
                  </div>
                )}

                {state.outputUrl && (
                  <Button render={<a href={state.outputUrl} download={downloadName} />} variant="secondary">
                    <Download data-icon="inline-start" />
                    Download Short
                  </Button>
                )}

                <Button disabled={state.isProcessing} onClick={reset} variant="outline">
                  <RotateCcw data-icon="inline-start" />
                  Reset
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
