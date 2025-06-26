import * as ort from 'onnxruntime-node';
import sharp from 'sharp';

async function preprocessImage(path) {
  const buffer = await sharp(path)
    .resize(160, 160)
    .removeAlpha()
    .raw()
    .toBuffer();
  return new Float32Array(buffer);
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB);
}

export async function runFaceMatch(path1, path2) {
  const session = await ort.InferenceSession.create('src/models/facenet.onnx');
  const inputName = session.inputNames[0];

  const input1 = await preprocessImage(path1);
  const input2 = await preprocessImage(path2);

  const feeds1 = { [inputName]: new ort.Tensor('float32', input1, [1, 160, 160, 3]) };
  const feeds2 = { [inputName]: new ort.Tensor('float32', input2, [1, 160, 160, 3]) };

  const [result1, result2] = await Promise.all([
    session.run(feeds1),
    session.run(feeds2)
  ]);

  const emb1 = result1[session.outputNames[0]].data;
  const emb2 = result2[session.outputNames[0]].data;

  return cosineSimilarity(emb1, emb2);
}
