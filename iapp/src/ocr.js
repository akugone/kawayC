import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import fs from 'fs';

export async function extractText(path, type = '') {
  const worker = await createWorker('fra+eng');

  let image = sharp(path);
  const metadata = await image.metadata();

  // Common preprocessing
  image = image
    .rotate()
    .resize({ width: 2000 }) 
    .grayscale()
    .normalize();

  image = image.sharpen();

  const processedBuffer = await image.toBuffer();

  // Run OCR
  const {
    data: { text },
  } = await worker.recognize(processedBuffer, {
    tessedit_char_whitelist:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÀÂÇÉÈÊËÎÏÔÙÛÜàâçéèêëîïôùûü -./:',
    preserve_interword_spaces: 1,
  });

  await worker.terminate();
  return text;
}
