export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

const NUM_WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
export function countWord(n, capital = false) {
  const TENS = { 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'a hundred' };
  const w = n <= 20 ? NUM_WORDS[n] : TENS[n] || String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

export const NAME_RULE = `<svg class="name-rule" viewBox="0 0 112 11" aria-hidden="true" focusable="false"><path vector-effect="non-scaling-stroke" d="M3 6.2C22 3.6 40 8.2 60 5.4 78 2.9 94 7.2 109 4.6"/></svg>`;
