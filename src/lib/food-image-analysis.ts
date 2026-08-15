export type AnalysisLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EvidenceAnalysis {
  engine: "on-device" | "vision";
  evidenceQuality: number;
  contamination: AnalysisLevel;
  hygiene: AnalysisLevel;
  indicators: string[];
  confidence: number;
}

export const ALLOWED_INDICATORS = [
  "visibly contaminated surface",
  "pest presence",
  "improper food storage",
  "exposed food",
  "overcrowding",
  "improper temperature indicator",
] as const;

interface PixelImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface PixelMetrics {
  mean: number;
  std: number;
  underexposed: number;
  overexposed: number;
  saturation: number;
  colorfulness: number;
  lapVar: number;
  edgeMean: number;
  anomalyRatio: number;
  maxBlobRatio: number;
  blobCount: number;
}

/**
 * Deterministic on-device food-evidence analyser.
 * Runs entirely in the browser (no network, no keys) and is fully auditable:
 * every score below is derived from pixel statistics — sharpness via Laplacian
 * variance, exposure from the luminance histogram, contamination from
 * hue-anomaly + dark-blob clustering, clutter from edge density.
 */
export function analyzePixelImage(img: PixelImage): EvidenceAnalysis {
  const { width: W, height: H, data } = img;
  const N = W * H;

  const lum = new Float32Array(N);
  const sat = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    sat[i] = max === 0 ? 0 : (max - min) / 255;
  }

  let mean = 0;
  for (let i = 0; i < N; i++) mean += lum[i];
  mean /= N;

  let varSum = 0;
  for (let i = 0; i < N; i++) varSum += (lum[i] - mean) * (lum[i] - mean);
  const std = Math.sqrt(varSum / N);

  let underexposed = 0;
  let overexposed = 0;
  let satSum = 0;
  let rgSum = 0;
  let rgMeanSum = 0;
  let ybSum = 0;
  let ybMeanSum = 0;
  for (let i = 0; i < N; i++) {
    if (lum[i] < 40) underexposed++;
    if (lum[i] > 215) overexposed++;
    satSum += sat[i];
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    const rg = r - g;
    const yb = 0.5 * (r + g) - b;
    rgSum += rg * rg;
    rgMeanSum += rg;
    ybSum += yb * yb;
    ybMeanSum += yb;
  }
  underexposed /= N;
  overexposed /= N;
  const meanSat = satSum / N;
  const rgMean = rgMeanSum / N;
  const ybMean = ybMeanSum / N;
  const c1 = Math.sqrt(Math.max(0, rgMean));
  const c2 = Math.sqrt(Math.max(0, ybMean));
  const c3 = Math.sqrt(Math.max(0, rgSum / N - rgMean * rgMean));
  const c4 = Math.sqrt(Math.max(0, ybSum / N - ybMean * ybMean));
  const colorfulnessFinal = c1 + c2 + 0.3 * (c3 + c4);

  let lapSum = 0;
  let lapN = 0;
  let edgeSum = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const c = lum[i];
      const lap = 4 * c - lum[i - 1] - lum[i + 1] - lum[i - W] - lum[i + W];
      lapSum += lap * lap;
      lapN++;
      const gx = Math.abs(lum[i + 1] - lum[i - 1]);
      const gy = Math.abs(lum[i + W] - lum[i - W]);
      edgeSum += gx + gy;
    }
  }
  const lapVar = lapSum / Math.max(1, lapN);
  const edgeMean = edgeSum / Math.max(1, lapN) / 2;

  let anomaly = 0;
  for (let i = 0; i < N; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const delta = mx - mn;
    if (delta < 20) continue;
    let h = 0;
    if (mx === r) h = ((g - b) / delta) % 6;
    else if (mx === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
    const v = mx;
    const s = delta / 255;
    const alert =
      ((h <= 25 || h >= 330) && s > 0.35 && v >= 60 && v <= 230) ||
      (h >= 75 && h <= 160 && s > 0.35 && v < 120) ||
      (v < 35 && s > 0.15) ||
      (h >= 25 && h <= 60 && s > 0.5 && v > 180);
    if (alert) anomaly++;
  }
  const anomalyRatio = anomaly / N;

  const GRID = 16;
  const cell = Math.floor(W / GRID);
  const darkCells = new Uint8Array(GRID * GRID);
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let sum = 0;
      let cnt = 0;
      for (let y = gy * cell; y < Math.min(H, (gy + 1) * cell); y++) {
        for (let x = gx * cell; x < Math.min(W, (gx + 1) * cell); x++) {
          sum += lum[y * W + x];
          cnt++;
        }
      }
      if (cnt > 0 && sum / cnt < 70) darkCells[gy * GRID + gx] = 1;
    }
  }
  const seen = new Uint8Array(GRID * GRID);
  let blobCount = 0;
  let maxBlob = 0;
  for (let i = 0; i < GRID * GRID; i++) {
    if (!darkCells[i] || seen[i]) continue;
    let size = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const cur = stack.pop()!;
      size++;
      const x = cur % GRID;
      const y = Math.floor(cur / GRID);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const ni = ny * GRID + nx;
        if (darkCells[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    blobCount++;
    if (size > maxBlob) maxBlob = size;
  }
  const maxBlobRatio = maxBlob / (GRID * GRID);

  const metrics: PixelMetrics = {
    mean,
    std,
    underexposed,
    overexposed,
    saturation: meanSat,
    colorfulness: colorfulnessFinal,
    lapVar,
    edgeMean,
    anomalyRatio,
    maxBlobRatio,
    blobCount,
  };

  return verdictFromMetrics(metrics);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function finite(v: number, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

function verdictFromMetrics(m: PixelMetrics): EvidenceAnalysis {
  const sharpScore = finite(clamp((m.lapVar - 2) / 30, 0, 1));
  const expoScore = finite(1 - clamp(m.underexposed * 1.2 + m.overexposed * 0.8, 0, 1));
  const contrastScore = finite(clamp(m.std / 70, 0, 1));
  const colorScore = finite(clamp(m.colorfulness / 60, 0, 1));
  const balanceScore = finite(clamp((128 - Math.abs(m.mean - 128)) / 128, 0, 1));

  const evidenceQuality = Math.round(
    100 * (0.3 * sharpScore + 0.2 * expoScore + 0.15 * contrastScore + 0.1 * colorScore + 0.25 * balanceScore)
  );

  const contamScore = finite(clamp((finite(m.anomalyRatio) / 0.02) * 0.7 + (finite(m.maxBlobRatio) / 0.3) * 0.3, 0, 1));
  const clutterScore = finite(clamp((finite(m.edgeMean) / 40) * 0.6 + (1 - clamp(finite(m.std) / 55, 0, 1)) * 0.4, 0, 1));
  const hygieneScore = finite(clamp(0.45 * contamScore + 0.25 * clutterScore + 0.3 * (1 - expoScore), 0, 1));

  const level = (s: number): AnalysisLevel => (s > 0.55 ? "HIGH" : s > 0.25 ? "MEDIUM" : "LOW");

  const contamination = level(contamScore);
  const hygiene = level(hygieneScore);

  const indicators: string[] = [];
  if (m.anomalyRatio >= 0.008) indicators.push("visibly contaminated surface");
  if (m.blobCount >= 4 && m.maxBlobRatio >= 0.1) indicators.push("pest presence");
  if (m.edgeMean > 38 && m.anomalyRatio > 0.003) indicators.push("overcrowding");
  if (m.mean < 60) indicators.push("poor lighting — scene too dark to fully assess");
  if (m.lapVar < 6) indicators.push("blurry capture — fine detail not assessable");

  return {
    engine: "on-device",
    evidenceQuality: finite(evidenceQuality, 0),
    contamination,
    hygiene,
    indicators: indicators.slice(0, 6),
    confidence: finite(clamp(0.35 + (finite(evidenceQuality) / 100) * 0.55, 0, 1), 0),
  };
}

/** Browser-side entry: decodes a data URL and analyses it. */
export function analyzeEvidenceImage(dataUrl: string): Promise<EvidenceAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 256 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas unavailable");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(
          analyzePixelImage({ width: canvas.width, height: canvas.height, data: imageData.data })
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("could not decode image"));
    img.src = dataUrl;
  });
}

const LEVEL_WEIGHT: Record<AnalysisLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

/** Merges per-photo analyses into one overall evidence assessment. */
export function aggregateEvidence(results: EvidenceAnalysis[]): EvidenceAnalysis {
  if (results.length === 0) {
    return {
      engine: "on-device",
      evidenceQuality: 0,
      contamination: "LOW",
      hygiene: "LOW",
      indicators: [],
      confidence: 0,
    };
  }
  const quality = Math.round(results.reduce((s, r) => s + r.evidenceQuality, 0) / results.length);
  let contam: AnalysisLevel = "LOW";
  let hygiene: AnalysisLevel = "LOW";
  for (const r of results) {
    if (LEVEL_WEIGHT[r.contamination] > LEVEL_WEIGHT[contam]) contam = r.contamination;
    if (LEVEL_WEIGHT[r.hygiene] > LEVEL_WEIGHT[hygiene]) hygiene = r.hygiene;
  }
  const seen = new Set<string>();
  const indicators: string[] = [];
  for (const r of results) {
    for (const ind of r.indicators) {
      if (!seen.has(ind)) {
        seen.add(ind);
        indicators.push(ind);
      }
    }
  }
  return {
    engine: "on-device",
    evidenceQuality: quality,
    contamination: contam,
    hygiene,
    indicators: indicators.slice(0, 6),
    confidence: Math.max(...results.map((r) => r.confidence)),
  };
}