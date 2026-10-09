import {
  BADGE_UNITS, LABEL_UNITS, anchorOf, arrowHead, contrastText, numbering, pathData, unitOf, noteList,
  type Annotation,
} from './annotations';

// Preparing a photograph for the palm view and rendering it, annotated, to a
// picture that can be saved or sent.

/** The longer side a stored photo is scaled down to. */
export const MAX_SIDE = 2400;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  // 'from-image' turns a phone photo the right way up using its EXIF orientation.
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await image.decode();
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode the picture'))), type, quality));
}

/** Decodes a photo, turns it upright and scales it down to MAX_SIDE, as a JPEG. */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const decoded = await decode(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas available');
    context.drawImage(decoded.source, 0, 0, width, height);
    return { blob: await canvasToBlob(canvas, 'image/jpeg', 0.9), width, height };
  } finally {
    decoded.release();
  }
}

/** Draws text broken into lines no wider than `maxWidth`; returns the height used. */
function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, draw: boolean): number {
  let line = '';
  let lines = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      if (draw) context.fillText(line, x, y + lines * lineHeight);
      lines++;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    if (draw) context.fillText(line, x, y + lines * lineHeight);
    lines++;
  }
  return lines * lineHeight;
}

function drawBadge(context: CanvasRenderingContext2D, annotation: Annotation, number: number, unit: number) {
  const { x, y } = anchorOf(annotation);
  const radius = BADGE_UNITS * unit;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = annotation.color;
  context.fill();
  context.lineWidth = 2 * unit;
  context.strokeStyle = contrastText(annotation.color) === '#ffffff' ? '#ffffff' : '#111827';
  context.stroke();
  context.fillStyle = contrastText(annotation.color);
  context.font = `bold ${radius * 1.2}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(number), x, y + radius * 0.06);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
}

function drawLabel(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, unit: number) {
  context.font = `bold ${size}px sans-serif`;
  context.lineJoin = 'round';
  context.lineWidth = Math.max(2, 4 * unit);
  context.strokeStyle = contrastText(color) === '#ffffff' ? '#111827' : '#ffffff';
  context.strokeText(text, x, y);
  context.fillStyle = color;
  context.fillText(text, x, y);
}

/** The picture with its drawing on it, and optionally the numbered notes under it, as a PNG. */
export async function renderAnnotated(image: Blob, width: number, height: number, annotations: Annotation[], withNotes: boolean): Promise<Blob> {
  const decoded = await decode(image);
  try {
    const unit = unitOf(width, height);
    const notes = withNotes ? noteList(annotations).filter(entry => entry.note || entry.label) : [];

    // Measure the notes first, to know how tall the picture must be.
    const measure = document.createElement('canvas').getContext('2d')!;
    const fontSize = Math.max(22, 26 * unit);
    const lineHeight = fontSize * 1.35;
    const padding = 20 * unit;
    measure.font = `${fontSize}px sans-serif`;
    const heights = notes.map(entry => wrapText(measure, `${entry.number}. ${[entry.label, entry.note].filter(Boolean).join(' – ')}`, 0, 0, width - 2 * padding, lineHeight, false) + lineHeight * 0.35);
    const notesHeight = notes.length ? heights.reduce((sum, h) => sum + h, 0) + 2 * padding : 0;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height + Math.ceil(notesHeight);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas available');
    context.drawImage(decoded.source, 0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const numbers = numbering(annotations);
    for (const annotation of annotations) {
      context.strokeStyle = annotation.color;
      context.fillStyle = annotation.color;
      context.lineWidth = annotation.width;
      switch (annotation.kind) {
        case 'pen':
          context.stroke(new Path2D(pathData(annotation.points)));
          break;
        case 'line':
        case 'arrow': {
          context.beginPath();
          context.moveTo(annotation.from.x, annotation.from.y);
          context.lineTo(annotation.to.x, annotation.to.y);
          context.stroke();
          if (annotation.kind === 'arrow') {
            const [a, b] = arrowHead(annotation.from, annotation.to, annotation.width * 5);
            context.beginPath();
            context.moveTo(annotation.to.x, annotation.to.y);
            context.lineTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.closePath();
            context.fill();
          }
          break;
        }
        case 'ellipse': {
          const rx = Math.abs(annotation.to.x - annotation.from.x) / 2;
          const ry = Math.abs(annotation.to.y - annotation.from.y) / 2;
          context.beginPath();
          context.ellipse((annotation.from.x + annotation.to.x) / 2, (annotation.from.y + annotation.to.y) / 2, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
          context.stroke();
          break;
        }
        case 'text':
          if (annotation.label) drawLabel(context, annotation.label, annotation.at.x, annotation.at.y, annotation.size, annotation.color, unit);
          break;
        case 'pin':
          break;
      }
      const number = numbers.get(annotation.id);
      if (number !== undefined) drawBadge(context, annotation, number, unit);
      if (annotation.kind !== 'text' && annotation.label) {
        const anchor = anchorOf(annotation);
        const offset = number !== undefined ? (BADGE_UNITS + 6) * unit : 8 * unit;
        drawLabel(context, annotation.label, anchor.x + offset, anchor.y + LABEL_UNITS * unit * 0.35, LABEL_UNITS * unit, annotation.color, unit);
      }
    }

    if (notes.length) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, height, width, canvas.height - height);
      context.fillStyle = '#111827';
      context.font = `${fontSize}px sans-serif`;
      let y = height + padding + fontSize;
      notes.forEach((entry, index) => {
        wrapText(context, `${entry.number}. ${[entry.label, entry.note].filter(Boolean).join(' – ')}`, padding, y, width - 2 * padding, lineHeight, true);
        y += heights[index];
      });
    }
    return await canvasToBlob(canvas, 'image/png');
  } finally {
    decoded.release();
  }
}
