// estimateAge.js
import * as faceapi from '@vladmandic/face-api';
import canvas from 'canvas';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export async function estimateAgeFromSelfie(selfiePath) {
  // Load models
  await faceapi.nets.tinyFaceDetector.loadFromDisk('src/models');
  await faceapi.nets.ageGenderNet.loadFromDisk('src/models');

  // Load image
  const img = await canvas.loadImage(selfiePath);

  // Detect face with age estimation
  const result = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withAgeAndGender();

  if (!result) {
    throw new Error('No face detected in selfie');
  }

  return Math.round(result.age); 
}
