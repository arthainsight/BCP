export type GrahaKey = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke';

export type RelationType =
  | 'conjunction'
  | 'secondFrom'
  | 'fifthFrom'
  | 'seventhFrom'
  | 'ninthFrom'
  | 'twelfthFrom';

export type Confidence = 'high' | 'medium' | 'low';

export type TopicKey =
  | 'career'
  | 'marriage'
  | 'education'
  | 'wealth'
  | 'children'
  | 'spirituality'
  | 'health'
  | 'general';

export type BnnGraha = {
  graha: GrahaKey;
  signIndex: number; // 0 = Aries … 11 = Pisces
  signDegree?: number; // 0–30
  absoluteDegree?: number;
  retrograde?: boolean;
};

export type BnnRelation = {
  anchor: GrahaKey;
  related: GrahaKey;
  relationType: RelationType;
  distance: number; // 1–12
};

export type BnnFinding = {
  anchor: GrahaKey;
  relatedGraha: GrahaKey;
  relationType: RelationType;
  strength: number;
  title: string;
  interpretation: string;
  confidence: Confidence;
  tags: string[];
};

// Kept for backward compatibility — v2 uses BnnAnalysisResult
export type BnnTopicResult = {
  topic: TopicKey;
  anchorsUsed: GrahaKey[];
  relations: BnnRelation[];
  findings: BnnFinding[];
  summary: string;
};

export type BnnChain = {
  path: GrahaKey[];          // ordered sequence of grahas
  relations: BnnRelation[];  // links between adjacent path members
  combinedKarakas: string[]; // merged top karakas from all path grahas
  strength: number;          // 0–100, multi-factor scored
  interpretation: string;    // deterministic descriptive line
};

export type BnnAnalysisResult = {
  topic: TopicKey;
  anchorsUsed: GrahaKey[];
  topRelations: BnnRelation[];
  topChains: BnnChain[];
  findings: BnnFinding[];  // all filtered structured findings (for UI use)
  keyFindings: string[];   // text of key pattern findings
  riskFactors: string[];   // text of risk findings (Ke, Ra-Mo)
  supportFactors: string[]; // text of support findings (Ju, trines)
  summary: string;         // max 5 lines, deterministic
};
