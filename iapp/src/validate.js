// validate.js

export function crossValidate({ idName, billName, estimatedAge, ageFromID }) {
  const normalized = {
    idName: normalize(idName),
    billName: normalize(billName),
  };

  const nameMatch = isNameMatch(normalized.idName, normalized.billName);

  const ageMatch =
    typeof estimatedAge === 'number' &&
    typeof ageFromID === 'number' &&
    Math.abs(estimatedAge - ageFromID) <= 6;
  return {
    nameMatch,
    ageMatch,
    overall: nameMatch && ageMatch,
  };
}

function isNameMatch(a, b) {
  if (!a || !b) return false;

  const partsA = a.split(' ').filter(Boolean);
  const partsB = b.split(' ').filter(Boolean);

  let common = 0;

  for (const partB of partsB) {
    for (const partA of partsA) {
      if (
        partA === partB ||
        partA.includes(partB) ||
        partB.includes(partA) ||
        levenshtein(partA, partB) <= 1
      ) {
        common++;
        break;
      }
    }
  }

  return common >= 2;
}

function normalize(str) {
  return str
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, '') // remove punctuation
    .toLowerCase()
    .replace(/\s+/g, ' ') // collapse extra spaces
    .trim() || '';
}

// Minimal Levenshtein distance implementation (synchronous)
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}
