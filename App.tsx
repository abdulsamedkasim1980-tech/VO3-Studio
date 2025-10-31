import React, { useState, useRef, useCallback } from "react";
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Footer } from './components/Footer';
import { ImageData, AnalysisResult } from './types';
import { analyzeContent } from "./services/geminiService";

// Helper functions defined outside the component to prevent re-creation on re-renders.
const fileToDataUrl = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, data: reader.result as string });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImg = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

const drawCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const scale = Math.max(w / sw, h / sh);
  const nw = sw * scale;
  const nh = sh * scale;
  const ox = (w - nw) / 2;
  const oy = (h - nh) / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, ox, oy, nw, nh);
};

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [title, setTitle] = useState("My VO3 Video");
  const [durationPerImage, setDurationPerImage] = useState(3);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Ready. Add images to begin.");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<ImageData | null>(null);
  const [subtitles, setSubtitles] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for text overlay
  const [overlayText, setOverlayText] = useState("");
  const [overlayPosition, setOverlayPosition] = useState("bottom-center");
  const [overlayFontSize, setOverlayFontSize] = useState(48);
  const [overlayColor, setOverlayColor] = useState("#FFFFFF");

  const audioPlayer = useRef<any | null>(null);

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 30 - images.length);
    Promise.all(files.map(fileToDataUrl)).then((urls) => {
      setImages((prev) => [...prev, ...urls]);
      setStatus(`${files.length} image(s) added.`);
    });
  };

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setStatus(`Audio file "${file.name}" selected.`);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then((data) => setLogoFile(data));
    setStatus(`Logo file "${file.name}" selected.`);
  };
  
  const createWebmFromImages = async (
    imageList: ImageData[],
    perImageSec: number,
    logo: ImageData | null,
    audio: File | null,
    textOverlay: { text: string; position: string; fontSize: number; color: string; }
  ): Promise<string | null> => {
    if (imageList.length === 0) {
      setStatus("Error: No images to generate video from.");
      return null;
    }

    setStatus("Initializing canvas...");
    const canvas = document.createElement("canvas");
    const firstImg = await loadImg(imageList[0].data);
    canvas.width = firstImg.naturalWidth > 1920 ? 1920 : firstImg.naturalWidth || 1280;
    canvas.height = firstImg.naturalHeight > 1080 ? 1080 : firstImg.naturalHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    let audioStream: MediaStream | null = null;
    if (audio) {
      setStatus("Processing audio...");
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ab = await audio.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(ab);
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(dest);
      source.start();
      audioStream = dest.stream;
    }

    const stream = canvas.captureStream(30);
    let combinedStream = stream;
    if (audioStream) {
      audioStream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
    }

    const recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm; codecs=vp9" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise(async (resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve(URL.createObjectURL(blob));
      };

      recorder.start();

      for (const [index, img] of imageList.entries()) {
        setStatus(`Rendering frame ${index + 1} of ${imageList.length}...`);
        const imageEl = await loadImg(img.data);
        drawCover(ctx, imageEl, canvas.width, canvas.height);
        
        if (logo) {
          const logoEl = await loadImg(logo.data);
          const lw = Math.min(200, canvas.width * 0.18);
          const lh = (logoEl.naturalHeight / logoEl.naturalWidth) * lw;
          ctx.globalAlpha = 0.95;
          ctx.drawImage(logoEl, canvas.width - lw - 20, canvas.height - lh - 20, lw, lh);
          ctx.globalAlpha = 1;
        }

        if (textOverlay.text.trim() !== "") {
          const { text, fontSize, color, position } = textOverlay;
          ctx.font = `bold ${fontSize}px 'Helvetica Neue', sans-serif`;
          ctx.fillStyle = color;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = Math.max(1, fontSize / 16);
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          const padding = 30;
          let x, y;

          if (position.includes('left')) {
              ctx.textAlign = 'left';
              x = padding;
          } else if (position.includes('right')) {
              ctx.textAlign = 'right';
              x = canvas.width - padding;
          } else { // center
              ctx.textAlign = 'center';
              x = canvas.width / 2;
          }

          if (position.includes('top')) {
              ctx.textBaseline = 'top';
              y = padding;
          } else if (position.includes('bottom')) {
              ctx.textBaseline = 'bottom';
              y = canvas.height - padding;
          } else { // middle
              ctx.textBaseline = 'middle';
              y = canvas.height / 2;
          }
          
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);

          // Reset shadow and other properties
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        await wait(perImageSec * 1000);
      }

      recorder.stop();
    });
  };

  const generateVideo = async () => {
    setIsProcessing(true);
    setVideoUrl(null);
    setStatus("Starting video generation...");
    try {
      const textOverlayConfig = {
        text: overlayText,
        position: overlayPosition,
        fontSize: overlayFontSize,
        color: overlayColor,
      };
      const demoUrl = await createWebmFromImages(images, durationPerImage, logoFile, audioFile, textOverlayConfig);
      setVideoUrl(demoUrl);
      setStatus("Preview generated successfully!");
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message || "An unknown error occurred"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const generatePlaceholderSubtitles = useCallback(async () => {
    setIsProcessing(true);
    setStatus("Generating placeholder subtitles...");
    await wait(800);
    setSubtitles("00:00:00,000 --> 00:00:05,000\nHello from VO3 Studio!\n\n00:00:05,500 --> 00:00:10,000\nThis is a placeholder subtitle, you can edit me.\n");
    setStatus("Placeholder subtitles added. You can now edit them.");
    setIsProcessing(false);
  }, []);

  const previewAudioWithFade = useCallback(() => {
    if (!audioFile) {
      setStatus("No audio file selected to preview.");
      return;
    }
    if (audioPlayer.current) {
        audioPlayer.current.stop();
        audioPlayer.current.dispose();
        audioPlayer.current = null;
        setStatus("Audio preview stopped.");
        return;
    }
    
    setStatus("Loading audio for preview...");
    const url = URL.createObjectURL(audioFile);
    // @ts-ignore
    const player = new Tone.Player({
      url,
      onload: () => {
        setStatus("Playing audio with fade-in...");
        player.volume.value = -Infinity;
        player.toDestination().start();
        player.volume.rampTo(0, 2.0); // 2 second fade-in
      },
      onstop: () => {
        URL.revokeObjectURL(url);
      }
    }).toDestination();
    audioPlayer.current = player;
  }, [audioFile]);

  const handleAnalyzeContent = useCallback(async () => {
    if (!title && !subtitles) {
      setStatus("Please provide a title or subtitles to analyze.");
      return;
    }
    setIsProcessing(true);
    setStatus("Analyzing content with Gemini...");
    setAnalysisResult(null);
    try {
      const result = await analyzeContent(title, subtitles);
      setAnalysisResult(result);
      setStatus("Content analysis complete.");
    } catch (error) {
      console.error("Error analyzing content:", error);
      setStatus(`Analysis Error: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [title, subtitles]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 sm:p-6 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
            <SettingsPanel
                title={title}
                setTitle={setTitle}
                durationPerImage={durationPerImage}
                setDurationPerImage={setDurationPerImage}
                subtitles={subtitles}
                setSubtitles={setSubtitles}
                images={images}
                logoFile={logoFile}
                audioFile={audioFile}
                handleImageFiles={handleImageFiles}
                handleLogoFile={handleLogoFile}
                handleAudioFile={handleAudioFile}
                generateVideo={generateVideo}
                generatePlaceholderSubtitles={generatePlaceholderSubtitles}
                previewAudioWithFade={previewAudioWithFade}
                handleAnalyzeContent={handleAnalyzeContent}
                isProcessing={isProcessing}
                status={status}
                analysisResult={analysisResult}
                videoUrl={videoUrl}
                overlayText={overlayText}
                setOverlayText={setOverlayText}
                overlayPosition={overlayPosition}
                setOverlayPosition={setOverlayPosition}
                overlayFontSize={overlayFontSize}
                setOverlayFontSize={setOverlayFontSize}
                overlayColor={overlayColor}
                setOverlayColor={setOverlayColor}
            />
        </div>
        <div className="lg:col-span-2">
            <PreviewPanel videoUrl={videoUrl} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;