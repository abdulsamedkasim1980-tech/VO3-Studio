export interface ImageData {
  name: string;
  data: string; // base64 data URL
}

export interface AnalysisSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  text: string;
  sources: AnalysisSource[];
}
