import crypto from "crypto";

export function generateKey({ prefix = "LC", groups = 4, groupLen = 5 } = {}) {
 
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  const segs = [];
  for (let g = 0; g < groups; g++) {
    let s = "";
    for (let i = 0; i < groupLen; i++) {
      const idx = crypto.randomInt(0, alphabet.length);
      s += alphabet[idx];
    }
    segs.push(s);
  }
  return `${prefix}-${segs.join("-")}`;
}
