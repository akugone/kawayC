import { runFaceMatch } from './faceMatch.js';
import { extractText } from './ocr.js';
import { crossValidate } from './validate.js';
import { estimateAgeFromSelfie } from './estimateAge.js';

const selfiePath = './src/images/selfie.jpg';
const idPath = './src/images/id.jpg';
const billPath = './src/images/bill.jpg';

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
  const lines = ocrText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  let name = '';
  let address = '';
  let dob = '';

  // Try to find full name (priority: after "atteste que" or "M. ")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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

  // Match French address (classic structure)
  const addressMatch = ocrText.match(
    /(\d{1,4}\s+(rue|avenue|boulevard|place|impasse|chemin|all[ée]e)\s+[^\n,]+)/i
  );
  if (addressMatch) {
    address = addressMatch[0];
  }

  // Match DOB (if available, though likely not in attestation)
  const dobMatch = ocrText.match(
    /(?:né\s+le|date\s+de\s+naissance)[^\d]*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/
  );
  if (dobMatch) {
    dob = dobMatch[1].replace(/[.\- ]/g, '/');
  }

  return {
    name,
    address,
    dob
  };
}



function parseIDFields(ocrText) {
  const lines = ocrText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  let lastName = '';
  let firstNames = '';
  let dob = null;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('nom:')) {
      lastName = line.split(':')[1]?.trim() || '';
    }

    if (lower.includes('prénom') || lower.includes('prénoms')) {
      firstNames = line.split(':')[1]?.trim() || '';
    }

    if (lower.includes('né') || lower.includes('naissance')) {
  const match = line.match(/(\d{2})[.\-/ ](\d{2})[.\-/ ](\d{4})/);
  if (match) {
    dob = `${match[1]}/${match[2]}/${match[3]}`;
  }
}
  }

  const name = `${lastName} ${firstNames}`.replace(/\s+/g, ' ').trim();

  return {
    name,
    address: '', // not on French ID
    dob
  };
}



function estimateAge(dobString) {
  if (!dobString) return null;
  const [day, month, year] = dobString.split('/');
  const birthDate = new Date(`${year}-${month}-${day}`);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));
  return age;
}

async function main() {
  console.log('▶️ Running face match...');
  const faceMatchScore = await runFaceMatch(selfiePath, idPath);
  const faceValid = faceMatchScore > 0.65;

  console.log('🧾 Running OCR...');
  const idText = await extractText(idPath, 'id');
  const billText = await extractText(billPath, 'bill');


  const idFields = parseIDFields(idText);
  const billFields = parseFrenchFields(billText);
    const age = estimateAge(idFields.dob);
    
const estimatedAge = await estimateAgeFromSelfie(selfiePath);
const ageFromID = estimateAge(idFields.dob);

  const validation = crossValidate({
    idName: normalize(idFields.name),
    billName: normalize(billFields.name),
      billAddress: normalize(billFields.address),
      estimatedAge,
    ageFromID
  });
    

  console.log('\n✅ KYC RESULT:\n');
  console.log({
    faceMatchScore,
    faceValid,
    estimatedAge: age,
    idName: idFields.name,
    billName: billFields.name,
    idAddress: idFields.address,
      billAddress: billFields.address,
    ...validation
  });
}

main().catch(err => {
  console.error('❌ Error during KYC processing:', err);
});
