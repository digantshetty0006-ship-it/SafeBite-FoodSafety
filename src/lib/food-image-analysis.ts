export type AnalysisLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EvidenceAnalysis {
  engine: "on-device" | "vision";
  evidenceQuality: number;
  contamination: AnalysisLevel;
  hygiene: AnalysisLevel;
  indicators: string[];
  findings?: string[];
  confidence: number;
  rationale?: string;
  model?: string;
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
  redCells: number;
  totalCells: number;
  maxRedCluster: number;
  darkSpotCells: number;
  smallDarkClusters: number;
  moldSpotCells: number;
  moldClusters: number;
}

/**
 * Deterministic on-device food-evidence analyser.
 * Runs entirely in the browser (no network, no keys) and is fully auditable:
 * every score is derived from pixel statistics — sharpness via Laplacian
 * variance, exposure from the luminance histogram, contamination from
 * LOCALISED strongly-saturated colour clusters (a stain or rot spot, not
 * scattered pixels), clutter from edge density. Deliberately conservative:
 * a clean scene must not be flagged on ambient colours like signage or
 * warm lighting.
 */
export function analyzePixelImage(img: PixelImage): EvidenceAnalysis {
  const { width: W, height: H, data } = img;
  const N = W * H;

  const lum = new Float32Array(N);
  const val = new Float32Array(N);
  const sat = new Float32Array(N);
  const hue = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    val[i] = max;
    const delta = max - min;
    sat[i] = max === 0 ? 0 : delta / 255;
    let h = 0;
    if (delta > 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    hue[i] = h;
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

  // Two conservative anomaly bands:
  //  - DEEP RED  (h in 345..15, sat>0.3, v in 60..180): blood / raw-meat
  //    juice / deep red rot. Bright signage (v>180) is excluded.
  //  - DARK CHROMATIC (v<80, sat>0.08): dark mould / rot / dirt spots.
  //    Neutral shadows and gray-black surfaces (sat ~ 0) are excluded.
  // Contamination is only claimed from LOCALISED clusters — giant uniform
  // regions (tables, floors, backdrops) are deliberately excluded.
  const isDeepRed = (i: number) => {
    const v = val[i];
    const s = sat[i];
    const h = hue[i];
    return (h <= 15 || h >= 345) && s > 0.3 && v >= 60 && v <= 180;
  };
  const isDarkChromatic = (i: number) => val[i] < 80 && sat[i] > 0.08;

  // 32x32 cell grid (analysis canvas is always 256x256 => 8px cells).
  const GRID = 32;
  const CELL = Math.floor(W / GRID);
  const cellRed = new Float32Array(GRID * GRID);
  const cellDark = new Float32Array(GRID * GRID);
  const cellSat = new Float32Array(GRID * GRID);
  const cellLum = new Float32Array(GRID * GRID);
  const cellHue = new Float32Array(GRID * GRID);
  const cellChromaStd = new Float32Array(GRID * GRID);
  const cellCount = new Float32Array(GRID * GRID);
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let red = 0;
      let dark = 0;
      let satSumCell = 0;
      let lumSumCell = 0;
      let hueSumCell = 0;
      let chromaSum = 0;
      let chromaSumSq = 0;
      let cnt = 0;
      for (let y = gy * CELL; y < Math.min(H, (gy + 1) * CELL); y++) {
        for (let x = gx * CELL; x < Math.min(W, (gx + 1) * CELL); x++) {
          const i = y * W + x;
          if (isDeepRed(i)) red++;
          if (isDarkChromatic(i)) dark++;
          satSumCell += sat[i];
          lumSumCell += lum[i];
          hueSumCell += hue[i];
          const chroma = val[i] / 255 - Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) / 255;
          chromaSum += chroma;
          chromaSumSq += chroma * chroma;
          cnt++;
        }
      }
      const ci = gy * GRID + gx;
      cellRed[ci] = cnt > 0 ? red / cnt : 0;
      cellDark[ci] = cnt > 0 ? dark / cnt : 0;
      cellSat[ci] = cnt > 0 ? satSumCell / cnt : 0;
      cellLum[ci] = cnt > 0 ? lumSumCell / cnt : 0;
      cellHue[ci] = cnt > 0 ? hueSumCell / cnt : 0;
      const chMean = cnt > 0 ? chromaSum / cnt : 0;
      cellChromaStd[ci] = cnt > 0 ? Math.sqrt(Math.max(0, chromaSumSq / cnt - chMean * chMean)) : 0;
      cellCount[ci] = cnt;
    }
  }

  const isRedCell = (i: number) => cellRed[i] > 0.4 && cellSat[i] > 0.3;
  const isDarkCell = (i: number) => cellDark[i] > 0.5;
  // Mould: green-blue-grey hue (incl. cyan cast-tinted patches), low
  // saturation, mid value, MOTTLED (high within-cell chroma texture). Smooth
  // cooked greens (palak, parsley) are uniform -> chromaStd stays low. Big
  // green regions (whole dishes, tablecloths) are giant clusters that the
  // flood window cap excludes; only LOCALISED patches are claimed as mould.
  const isMoldCell = (i: number) =>
    cellHue[i] >= 60 &&
    cellHue[i] <= 200 &&
    cellSat[i] > 0.05 &&
    cellLum[i] > 40 &&
    cellLum[i] < 215 &&
    cellDark[i] < 0.85 &&
    cellChromaStd[i] > 0.015;

  const flood = (pred: (i: number) => boolean, minSize: number, maxSize: number) => {
    const visited = new Uint8Array(GRID * GRID);
    let total = 0;
    let largest = 0;
    let spotTotal = 0;
    let small = 0;
    for (let i = 0; i < GRID * GRID; i++) {
      if (cellCount[i] === 0 || visited[i] || !pred(i)) continue;
      let size = 0;
      const stack = [i];
      visited[i] = 1;
      while (stack.length) {
        const cur = stack.pop()!;
        size++;
        const cx = cur % GRID;
        const cy = Math.floor(cur / GRID);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
          const ni = ny * GRID + nx;
          if (!visited[ni] && pred(ni)) {
            visited[ni] = 1;
            stack.push(ni);
          }
        }
      }
      total += size;
      if (size > largest) largest = size;
      if (size >= minSize && size <= maxSize) {
        small++;
        spotTotal += size;
      }
    }
    return { total, largest, small, spotTotal };
  };

  const redCells = flood(isRedCell, 0, 1024);
  const darkCells = flood(isDarkCell, 2, 15);
  // Mould patches are typically LARGE (unlike pest-sized dark spots), so the
  // window is wide — the chroma-texture gate keeps smooth greens out. Only
  // giant regions (whole-tablecloths) exceed the cap.
  const moldCells = flood(isMoldCell, 2, 60);

  const metrics: PixelMetrics = {
    mean,
    std,
    underexposed,
    overexposed,
    saturation: meanSat,
    colorfulness: colorfulnessFinal,
    lapVar,
    edgeMean,
    redCells: redCells.total,
    totalCells: GRID * GRID,
    maxRedCluster: redCells.largest,
    darkSpotCells: darkCells.spotTotal,
    smallDarkClusters: darkCells.small,
    moldSpotCells: moldCells.spotTotal,
    moldClusters: moldCells.small,
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

  // Localised, deep-colour contamination only. If strong cells cover most of
  // the frame it is a colour cast (or the whole image is one colour), not a
  // contaminant — demote to 0.
  const redLocalized = finite(m.redCells / m.totalCells) < 0.6;
  const redScore = redLocalized ? clamp(finite(m.maxRedCluster) / 10, 0, 1) : 0;
  const darkScore = clamp(finite(m.darkSpotCells) / 40, 0, 1);
  const moldScore = clamp(finite(m.moldSpotCells) / 36, 0, 1);
  let contamScore = finite(clamp(0.5 * redScore + 0.2 * darkScore + 0.3 * moldScore, 0, 1));
  const clutterScore = finite(clamp((m.edgeMean / 40) * 0.6 + (1 - clamp(finite(m.std) / 55, 0, 1)) * 0.4, 0, 1));

  const level = (s: number): AnalysisLevel => (s > 0.55 ? "HIGH" : s > 0.25 ? "MEDIUM" : "LOW");

  // Indicator selection happens BEFORE flooring so indicator-vs-level
  // coherence rules (below) stay consistent with the visible signals.
  const moldVisible = m.moldClusters >= 2 || m.moldSpotCells >= 10;
  const pestVisible = !moldVisible && m.smallDarkClusters >= 2 && m.mean > 60;

  // Coherence: a contamination indicator must not sit on a LOW level.
  if (moldVisible) contamScore = Math.max(contamScore, moldScore >= 0.6 ? 0.62 : 0.3);
  if (pestVisible) contamScore = Math.max(contamScore, 0.35);

  const hygieneScore = finite(clamp(0.45 * contamScore + 0.25 * clutterScore + 0.3 * (1 - expoScore), 0, 1));

  const contamination = level(contamScore);
  const hygiene = level(hygieneScore);

  const indicators: string[] = [];
  if (moldVisible) indicators.push("visible mold growth");
  if (pestVisible) indicators.push("pest presence");
  if ((redLocalized && m.maxRedCluster >= 8) || m.darkSpotCells >= 28) indicators.push("visibly contaminated surface");
  if (m.edgeMean > 40 && m.std > 55) indicators.push("overcrowding");
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

/** Browser-side entry: decodes a data URL and analyses it on a fixed 256x256 grid. */
export function analyzeEvidenceImage(dataUrl: string): Promise<EvidenceAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas unavailable");
        ctx.drawImage(img, 0, 0, 256, 256);
        const imageData = ctx.getImageData(0, 0, 256, 256);
        resolve(analyzePixelImage({ width: 256, height: 256, data: imageData.data }));
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