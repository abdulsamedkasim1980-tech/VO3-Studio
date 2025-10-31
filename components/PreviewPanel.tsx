import React, { useRef, useEffect } from 'react';

interface PreviewPanelProps {
  videoUrl: string | null;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }
  }, [videoUrl]);
    
  return (
    <aside className="bg-slate-800/30 rounded-2xl p-4 sm:p-6 space-y-6 sticky top-6 backdrop-blur-sm border border-slate-700">
      <h2 className="text-lg font-semibold text-slate-100">Preview</h2>
      
      <div className="aspect-video w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-slate-400">
            <p>Your generated video preview will appear here.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-slate-100">How This Stays Free</h3>
        <ol className="text-sm mt-2 list-decimal list-inside text-slate-400 space-y-1">
          <li>Runs heavy work client-side using WebAssembly & browser APIs.</li>
          <li>Offers optional serverless helpers for power users (pay-as-you-go).</li>
          <li>Core features remain offline, private, and free.</li>
        </ol>
      </div>

      <div className="text-xs text-slate-500">
        VO3 Studio is a privacy-first demo. For larger projects, consider optional server support or community-run workers. All processing for the free version happens on your device.
      </div>
    </aside>
  );
};
