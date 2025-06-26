// index.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { runFaceMatch } from './faceMatch.js';
import { extractText } from './ocr.js';
import { crossValidate } from './validate.js';
import { estimateAgeFromSelfie } from './estimateAge.js';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const { IEXEC_OUT } = process.env;
const TEMP_DIR = './tmp';

async function saveBufferToFile(buffer, filename) {
  const filepath = path.join(TEMP_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}

function normalize(str) {
  return str
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim() || '';
}

function parseFrenchFields(ocrText) {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  let name = '', address = '', dob = '';
  for (let line of lines) {
    const mMatch = line.match(/M[\. ]+([A-Z][a-zéèêîï]+)\s+([A-ZÉÈÀÂ\-']{2,})/);
    if (mMatch) {
      name = `${mMatch[1]} ${mMatch[2]}`;
      break;
    }
    const altMatch = line.match(/\b([A-Z][a-zéèêîï]+)\s+([A-ZÉÈÀÂ\-']{2,})\b/);
    if (altMatch && !name.toLowerCase().includes(altMatch[1].toLowerCase())) {
      name = `${altMatch[1]} ${altMatch[2]}`;
    }
  }
  const addressMatch = ocrText.match(/(\d{1,4}\s+(rue|avenue|boulevard|place|impasse|chemin|all[ée]e)\s+[^\n,]+)/i);
  if (addressMatch) address = addressMatch[0];
  const dobMatch = ocrText.match(/(?:né\s+le|date\s+de\s+naissance)[^\d]*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/);
  if (dobMatch) dob = dobMatch[1].replace(/[.\- ]/g, '/');
  return { name, address, dob };
}

function parseIDFields(ocrText) {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  let lastName = '', firstNames = '', dob = null;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('nom:')) lastName = line.split(':')[1]?.trim() || '';
    if (lower.includes('prénom') || lower.includes('prénoms')) firstNames = line.split(':')[1]?.trim() || '';
    if (lower.includes('né') || lower.includes('naissance')) {
      const match = line.match(/(\d{2})[./\- ](\d{2})[./\- ](\d{4})/);
      if (match) dob = `${match[1]}/${match[2]}/${match[3]}`;
    }
  }
  const name = `${lastName} ${firstNames}`.replace(/\s+/g, ' ').trim();
  return { name, address: '', dob };
}

function estimateAge(dobString) {
  if (!dobString) return null;
  const [day, month, year] = dobString.split('/');
  const birthDate = new Date(`${year}-${month}-${day}`);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));
  return age;
}

const main = async () => {
  let computedJsonObj = {};

  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    const deserializer = new IExecDataProtectorDeserializer();

    const selfieBuffer = await deserializer.getValue('selfie', Buffer);
    const idBuffer = await deserializer.getValue('id', Buffer);
    const billBuffer = await deserializer.getValue('addressProof', Buffer);

    const selfiePath = await saveBufferToFile(selfieBuffer, 'selfie.jpg');
    const idPath = await saveBufferToFile(idBuffer, 'id.jpg');
    const billPath = await saveBufferToFile(billBuffer, 'bill.jpg');

    console.log('▶️ Running face match...');
    const faceMatchScore = await runFaceMatch(selfiePath, idPath);
    const faceValid = faceMatchScore > 0.65;

    console.log('🧾 Running OCR...');
    const idText = await extractText(idPath, 'id');
    const billText = await extractText(billPath, 'bill');

    const idFields = parseIDFields(idText);
    const billFields = parseFrenchFields(billText);
    const ageFromID = estimateAge(idFields.dob);
    const estimatedAge = await estimateAgeFromSelfie(selfiePath);

    const validation = crossValidate({
      idName: normalize(idFields.name),
      billName: normalize(billFields.name),
      idAddress: normalize(idFields.address),
      billAddress: normalize(billFields.address),
      estimatedAge,
      ageFromID
    });

    const result = {
      faceMatchScore,
      faceValid,
      estimatedAge,
      idName: idFields.name,
      billName: billFields.name,
      idAddress: idFields.address,
      billAddress: billFields.address,
      ...validation
    };
    
    const output = {
  faceMatchScore,
  faceValid,
  ageMatch: validation.ageMatch,
  overall: validation.overall
};

    await fs.writeFile(`${IEXEC_OUT}/result.txt`, JSON.stringify(output, null, 2));
    computedJsonObj = { 'deterministic-output-path': `${IEXEC_OUT}/result.txt` };
  } catch (e) {
    console.error('❌ Error:', e);
    computedJsonObj = {
      'deterministic-output-path': IEXEC_OUT,
      'error-message': e.message || 'Oops something went wrong'
    };
  } finally {
    await fs.writeFile(`${IEXEC_OUT}/computed.json`, JSON.stringify(computedJsonObj));
  }
};

main();
