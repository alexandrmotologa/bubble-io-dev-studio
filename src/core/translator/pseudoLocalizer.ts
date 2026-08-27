export class PseudoLocalizerEngine {
  private static charMap: Record<string, string> = {
    a: 'å', A: 'Å',
    b: 'ƀ', B: 'Ɓ',
    c: 'ç', C: 'Ç',
    d: 'đ', D: 'Ð',
    e: 'é', E: 'É',
    f: 'ƒ', F: 'Ƒ',
    g: 'ğ', G: 'Ĝ',
    h: 'ĥ', H: 'Ĥ',
    i: 'î', I: 'Î',
    j: 'ĵ', J: 'Ĵ',
    k: 'ķ', K: 'Ķ',
    l: 'ļ', L: 'Ļ',
    m: 'ɱ', M: 'Ṁ',
    n: 'ñ', N: 'Ñ',
    o: 'ö', O: 'Ö',
    p: 'þ', P: 'Þ',
    q: 'ǫ', Q: 'Ǫ',
    r: 'ř', R: 'Ř',
    s: 'š', S: 'Š',
    t: 'ţ', T: 'Ţ',
    u: 'ü', U: 'Ü',
    v: 'ṽ', V: 'Ṽ',
    w: 'ŵ', W: 'Ŵ',
    x: 'ẋ', X: 'Ẋ',
    y: 'ý', Y: 'Ý',
    z: 'ž', Z: 'Ž'
  };

  /**
   * Generates pseudo-localized test string e.g. "Save changes" -> "[Šåṽé çĥåñğéš~~~~]"
   * Useful to test layout overflow and font support across Bubble elements
   */
  public static localize(text: string, expansionPercent: number = 30): string {
    let result = '';
    let insideToken = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Preserve [variables] or {placeholders} unmodified
      if (char === '[' || char === '{' || char === '<') {
        insideToken = true;
        result += char;
        continue;
      }
      if (char === ']' || char === '}' || char === '>') {
        insideToken = false;
        result += char;
        continue;
      }

      if (insideToken) {
        result += char;
      } else {
        result += this.charMap[char] || char;
      }
    }

    // Add expansion padding to verify responsive containers
    const paddingCount = Math.max(1, Math.round((text.length * expansionPercent) / 100));
    const padding = '~'.repeat(paddingCount);

    return `[${result}${padding}]`;
  }
}
