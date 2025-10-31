import React from 'react';
import { ImageData, AnalysisResult } from '../types';
import { ImageGrid } from './ImageGrid';
import { PlayIcon, DownloadIcon, SparklesIcon, MusicIcon, SubtitlesIcon, GenerateIcon } from './icons';

interface SettingsPanelProps {
  title: string;
  setTitle: (value: string) => void;
  durationPerImage: number;
  setDurationPerImage: (value: number) => void;
  subtitles: string;
  setSubtitles: (value: string) => void;
  images: ImageData[];
  logoFile: ImageData | null;
  audioFile: File | null;
  handleImageFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogoFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAudioFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  generateVideo: () => void;
  generatePlaceholderSubtitles: () => void;
  previewAudioWithFade: () => void;
  handleAnalyzeContent: () => void;
  isProcessing: boolean;
  status: string;
  analysisResult: AnalysisResult | null;
  videoUrl: string | null;
  overlayText: string;
  setOverlayText: (value: string) => void;
  overlayPosition: string;
  setOverlayPosition: (value: string) => void;
  overlayFontSize: number;
  setOverlayFontSize: (value: number) => void;
  overlayColor: string;
  setOverlayColor: (value: string) => void;
}

const InputField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
    {children}
  </div>
);

const FileInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        type="file"
        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-indigo-50 hover:file:bg-indigo-600 transition-colors"
        {...props}
    />
);

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; className?: string; }> = ({ onClick, disabled, children, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all ${
            disabled
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : className
        }`}
    >
        {children}
    </button>
);

const positionOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'middle-left', label: 'Middle Left' },
    { value: 'middle-center', label: 'Center' },
    { value: 'middle-right', label: 'Middle Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  title, setTitle, durationPerImage, setDurationPerImage, subtitles, setSubtitles, images,
  handleImageFiles, handleLogoFile, handleAudioFile, generateVideo, generatePlaceholderSubtitles,
  previewAudioWithFade, handleAnalyzeContent, isProcessing, status, analysisResult, videoUrl,
  overlayText, setOverlayText, overlayPosition, setOverlayPosition,
  overlayFontSize, setOverlayFontSize, overlayColor, setOverlayColor
}) => {

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${title.replace(/\s+/g, "_") || "vo3_video"}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
    
  return (
    <section className="bg-slate-800/50 rounded-2xl p-4 sm:p-6 space-y-6 backdrop-blur-sm border border-slate-700">
      <h2 className="text-xl font-semibold text-slate-100">Project Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Video Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700/50 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" />
        </InputField>
        <InputField label={`Seconds per Image (${durationPerImage}s)`}>
            <input type="range" min="1" max="10" step="0.5" value={durationPerImage} onChange={(e) => setDurationPerImage(Number(e.target.value))} className="w-full mt-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
        </InputField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label={`Upload Images (${images.length}/30)`}>
          <FileInput accept="image/*" multiple onChange={handleImageFiles} />
        </InputField>
        <InputField label="Logo Overlay (Optional)">
          <FileInput accept="image/*" onChange={handleLogoFile} />
        </InputField>
      </div>
      
      <InputField label="Background Audio (Optional)">
        <FileInput accept="audio/*" onChange={handleAudioFile} />
      </InputField>

      <div className="border-t border-slate-700 my-4"></div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">Text Overlay (Optional)</h3>
        <InputField label="Overlay Text">
          <input value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="e.g., Summer Vacation 2024" className="w-full mt-1 p-2 rounded bg-slate-700/50 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" />
        </InputField>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Position">
            <select value={overlayPosition} onChange={(e) => setOverlayPosition(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700/50 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 h-10">
              {positionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </InputField>
          <InputField label={`Font Size: ${overlayFontSize}px`}>
            <input type="range" min="16" max="128" step="1" value={overlayFontSize} onChange={(e) => setOverlayFontSize(Number(e.target.value))} className="w-full mt-3 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          </InputField>
          <InputField label="Color">
            <div className="relative w-full mt-1">
              <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="w-full h-10 p-1 bg-slate-700/50 border border-slate-600 rounded-lg cursor-pointer" />
              <span className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none font-mono text-sm text-slate-300">{overlayColor}</span>
            </div>
          </InputField>
        </div>
      </div>

      <div className="border-t border-slate-700 my-4"></div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-100">Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <ActionButton onClick={previewAudioWithFade} disabled={isProcessing} className="bg-teal-600 hover:bg-teal-500 text-white"><MusicIcon /> Preview Audio</ActionButton>
            <ActionButton onClick={generatePlaceholderSubtitles} disabled={isProcessing} className="bg-sky-600 hover:bg-sky-500 text-white"><SubtitlesIcon /> Get Subs</ActionButton>
            <ActionButton onClick={handleAnalyzeContent} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-500 text-white"><SparklesIcon /> Fact Check</ActionButton>
            <ActionButton onClick={generateVideo} disabled={isProcessing || images.length === 0} className="bg-indigo-600 hover:bg-indigo-500 text-white"><GenerateIcon /> Generate</ActionButton>
            <ActionButton onClick={downloadVideo} disabled={!videoUrl || isProcessing} className="bg-green-600 hover:bg-green-500 text-white col-span-2 md:col-span-1"><DownloadIcon /> Download</ActionButton>
        </div>
      </div>
      
      <div>
        <InputField label="Subtitles / Captions (Editable SRT/VTT format)">
          <textarea value={subtitles} onChange={(e) => setSubtitles(e.target.value)} rows={6} className="w-full mt-2 p-2 rounded bg-slate-700/50 border border-slate-600 font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="00:00:00,000 --> 00:00:05,000&#10;Your text here..." />
        </InputField>
      </div>

      <div className="mt-4 text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg">
        <p className="font-semibold">Status: <span className={`font-normal ${isProcessing ? 'animate-pulse' : ''}`}>{status}</span></p>
        {analysisResult && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-2"><SparklesIcon/> Gemini Analysis</h4>
            <p className="text-slate-300 whitespace-pre-wrap">{analysisResult.text}</p>
            {analysisResult.sources.length > 0 && (
              <div className="mt-2">
                <h5 className="text-xs font-semibold text-slate-400">Sources:</h5>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  {analysisResult.sources.map(source => (
                    <li key={source.uri}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate block">{source.title || source.uri}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <ImageGrid images={images} />
    </section>
  );
};