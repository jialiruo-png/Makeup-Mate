// ============== 妆容卡片 ==============
export type SourceType = "link" | "image" | "video" | "inspiration";

export interface MakeupStep {
  stepNo: number;
  part: string;
  instruction: string;
  tips: string[];
}

export interface MakeupCard {
  cardId: string;
  sourceType: SourceType;
  sourcePlatform?: string;
  sourceUrl?: string | null;
  sourceAssetId?: string | null;
  title: string;
  styleTags: string[];
  difficulty: string;
  estimatedTime: string;
  scenes: string[];
  productTypes: string[];
  steps: MakeupStep[];
  riskPoints: string[];
  aiTip: string;
  confidence: number;
  evidenceSummary?: {
    hasVideoEvidence: boolean;
    supportLevel: "mock" | "weak" | "strong";
  };
  createdAt: string;
}

export interface VideoEvidence {
  sourceType: SourceType;
  selectedFrames: string[];
  regions: Record<string, unknown>;
  visualHints: {
    lipColor?: string;
    blushPosition?: string;
    eyeMakeupTone?: string;
    eyelinerLengthHint?: string;
  };
}

export interface AnalyzeResponse {
  card: MakeupCard;
  videoEvidence: VideoEvidence;
}

// ============== 灵感库 ==============
export type InspirationType = "creator" | "style" | "scene" | "beginner_training";

export interface Inspiration {
  inspirationId: string;
  type: InspirationType;
  name: string;
  avatarUrl?: string | null;
  styleTags: string[];
  representativeLook: string;
  suitableFor: string[];
  difficulty: string;
  analysis: string;
  representativeVideoUrl?: string | null;
  categories: {
    style: string[];
    creatorType: string[];
    scene: string[];
  };
}

// ============== 聊天 ==============
export type ChatMode = "text_companion" | "voice_companion";
export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "image" | "step_card" | "card_summary";

export interface ChatMessage {
  messageId: string;
  role: MessageRole;
  content: string;
  messageType: MessageType;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface ChatSession {
  sessionId: string;
  cardId?: string;
  inspirationId?: string;
  mode: ChatMode;
  currentStep: string;
  messages: ChatMessage[];
}

// ============== 个人风格 / 档案 ==============
export interface FaceGeometry {
  faceDetected: boolean;
  source: string;
  faceRatio?: string;
  headPose?: { yaw: string; pitch: string };
  suggestionAnchors?: {
    blushArea?: string;
    eyelinerArea?: string;
    lipArea?: string;
  };
}

export interface BeautyProfile {
  faceShape: string;
  skinTone: string;
  featureStyle: string;
  eyeType: string;
  preferredBlushPosition: string;
  preferredEyeliner: string;
  preferredLipColors: string[];
  avoidStyles: string[];
}

export interface AnalyzePhotoResponse {
  retention: {
    rawImage: "session_only" | "profile_summary_allowed";
    longTermProfileSaved: boolean;
  };
  faceGeometry: FaceGeometry;
  beautyProfile: BeautyProfile;
}

// ============== 媒体 ==============
export type MediaPurpose =
  | "makeup_source_image"
  | "makeup_source_video"
  | "selfie"
  | "progress_check";

export type RetentionPolicy =
  | "session_only"
  | "profile_summary_allowed"
  | "temporary_source";

export interface MediaAsset {
  mediaAssetId: string;
  fileType: "image" | "video";
  purpose: MediaPurpose;
  analysisStatus: "pending" | "ready" | "failed";
  retentionPolicy: RetentionPolicy;
  expiresAt?: string;
}

// ============== 历史 ==============
export type HistoryStatus = "analyzed" | "imported" | "completed";

export interface HistoryItem {
  itemId: string;
  cardId?: string;
  sessionId?: string;
  title: string;
  source: SourceType;
  status: HistoryStatus;
  createdAt: string;
}

// ============== 通用 ==============
export interface ToastState {
  message: string;
  tone?: "info" | "success" | "warn" | "error";
}

export type ActiveTab = "home" | "chat" | "profile";
