import type { MakeupCard } from "@/types";

const W = 750;
const PAD = 36;
const ACCENT = "#7A2E2E";
const TEXT_MAIN = "#2A1A1A";
const TEXT_BODY = "#5A4949";
const TEXT_MUTED = "#9A8888";
const TAG_BG = "rgba(122, 46, 46, 0.08)";
const BG = "#FBF5F0";
const DIVIDER = "rgba(122, 46, 46, 0.12)";

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  y: number;
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: 400 | 500 | 600 | 700 = 400,
) {
  ctx.font = `${weight} ${size}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(
  c: DrawCtx,
  text: string,
  x: number,
  maxWidth: number,
  size: number,
  weight: 400 | 500 | 600 | 700,
  color: string,
  lineHeight = 1.55,
): void {
  setFont(c.ctx, size, weight);
  c.ctx.fillStyle = color;
  const lines = wrap(c.ctx, text, maxWidth);
  for (const line of lines) {
    c.ctx.fillText(line, x, c.y + size);
    c.y += size * lineHeight;
  }
}

function drawTags(c: DrawCtx, tags: string[]): void {
  if (tags.length === 0) return;
  const size = 22;
  const padX = 14;
  const padY = 8;
  const gap = 10;
  setFont(c.ctx, size, 500);
  let x = PAD;
  let rowH = size + padY * 2 + gap;
  for (const t of tags) {
    const tw = c.ctx.measureText(t).width;
    const boxW = tw + padX * 2;
    if (x + boxW > W - PAD) {
      x = PAD;
      c.y += rowH;
    }
    c.ctx.fillStyle = TAG_BG;
    roundRect(c.ctx, x, c.y, boxW, size + padY * 2, 999);
    c.ctx.fill();
    c.ctx.fillStyle = ACCENT;
    c.ctx.fillText(t, x + padX, c.y + size + padY - 4);
    x += boxW + gap;
  }
  c.y += rowH;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawDivider(c: DrawCtx): void {
  c.ctx.strokeStyle = DIVIDER;
  c.ctx.lineWidth = 1;
  c.ctx.beginPath();
  c.ctx.moveTo(PAD, c.y);
  c.ctx.lineTo(W - PAD, c.y);
  c.ctx.stroke();
  c.y += 24;
}

function drawLabel(c: DrawCtx, text: string): void {
  drawText(c, text, PAD, W - PAD * 2, 18, 500, TEXT_MUTED, 1.4);
  c.y += 4;
}

function measureCard(card: MakeupCard): number {
  // 跑一次空 canvas 量高度，避免最终图被截。
  const probe = document.createElement("canvas");
  probe.width = W;
  probe.height = 4000;
  const ctx = probe.getContext("2d")!;
  const c: DrawCtx = { ctx, y: 0 };
  paint(c, card, /*measureOnly*/ true);
  return Math.ceil(c.y + PAD + 60);
}

function paint(c: DrawCtx, card: MakeupCard, measureOnly: boolean): void {
  const contentW = W - PAD * 2;

  c.y = PAD;
  // 顶部 kicker
  drawText(c, "妆搭 Makeup Mate · 妆容解析卡片", PAD, contentW, 20, 500, ACCENT, 1.4);
  c.y += 6;

  // 标题
  drawText(c, card.title, PAD, contentW, 38, 700, TEXT_MAIN, 1.3);
  c.y += 10;

  // 风格标签
  drawTags(c, card.styleTags);
  c.y += 4;

  // 难度 / 耗时
  setFont(c.ctx, 22, 500);
  if (!measureOnly) {
    c.ctx.fillStyle = TEXT_BODY;
    c.ctx.fillText(`复刻难度  ${card.difficulty}`, PAD, c.y + 22);
    c.ctx.fillText(
      `预计耗时  ${card.estimatedTime}`,
      PAD + contentW / 2,
      c.y + 22,
    );
  }
  c.y += 22 * 1.6 + 12;

  drawDivider(c);

  // 产品类型
  if (card.productTypes.length > 0) {
    drawLabel(c, "产品类型");
    drawText(
      c,
      card.productTypes.join("、"),
      PAD,
      contentW,
      24,
      400,
      TEXT_BODY,
      1.7,
    );
    c.y += 18;
    drawDivider(c);
  }

  // 步骤
  if (card.steps.length > 0) {
    drawLabel(c, "步骤");
    for (const step of card.steps) {
      drawText(
        c,
        `Step ${step.stepNo} · ${step.part}`,
        PAD,
        contentW,
        24,
        600,
        ACCENT,
        1.4,
      );
      c.y += 2;
      drawText(c, step.instruction, PAD, contentW, 24, 400, TEXT_BODY, 1.65);
      for (const tip of step.tips || []) {
        drawText(c, `· ${tip}`, PAD + 12, contentW - 12, 22, 400, TEXT_MUTED, 1.55);
      }
      c.y += 14;
    }
    drawDivider(c);
  }

  // 翻车点
  if (card.riskPoints.length > 0) {
    drawLabel(c, "翻车点");
    drawText(
      c,
      card.riskPoints.join(" / "),
      PAD,
      contentW,
      24,
      400,
      TEXT_BODY,
      1.7,
    );
    c.y += 18;
    drawDivider(c);
  }

  // AI 提示
  if (card.aiTip) {
    drawLabel(c, "AI 小提示");
    drawText(c, card.aiTip, PAD, contentW, 24, 400, TEXT_BODY, 1.7);
    c.y += 18;
  }

  // 底部水印
  c.y += 8;
  drawText(
    c,
    "由 妆搭 Makeup Mate 生成",
    PAD,
    contentW,
    18,
    400,
    TEXT_MUTED,
    1.4,
  );
}

export function renderCardToCanvas(card: MakeupCard): HTMLCanvasElement {
  const h = measureCard(card);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // 背景
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, h);

  // 右上角装饰圆
  ctx.fillStyle = "rgba(122, 46, 46, 0.06)";
  ctx.beginPath();
  ctx.arc(W - 40, 40, 80, 0, Math.PI * 2);
  ctx.fill();

  paint({ ctx, y: 0 }, card, false);
  return canvas;
}

export function downloadCardAsImage(card: MakeupCard): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = renderCardToCanvas(card);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("生成图片失败"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeTitle = card.title.replace(/[\\/:*?"<>|]/g, "_");
        a.href = url;
        a.download = `妆搭_${safeTitle}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      }, "image/png");
    } catch (err) {
      reject(err);
    }
  });
}
