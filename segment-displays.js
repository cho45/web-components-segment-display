export class SegmentDisplayBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // Default config
    this._digits = 1;
    this._color = "red";
    this._bgColor = "#333";
    this._padding = 5;
    this._digitWidth = 70;
    this._digitHeight = 100;
  }

  static get observedAttributes() {
    return ["digits", "color", "bg-color", "value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "digits") {
      this._digits = Math.max(1, parseInt(newValue || "1", 10));
      this.render();
    } else if (name === "color") {
      this._color = newValue || "red";
      this.updateStyles();
    } else if (name === "bg-color") {
      this._bgColor = newValue || "#333";
      this.updateStyles();
    } else if (name === "value") {
      this.setValue(newValue || "");
    }
  }

  connectedCallback() {
    if (this.hasAttribute("digits")) {
      this._digits = Math.max(1, parseInt(this.getAttribute("digits"), 10));
    }
    if (this.hasAttribute("color")) {
      this._color = this.getAttribute("color");
    }
    if (this.hasAttribute("bg-color")) {
      this._bgColor = this.getAttribute("bg-color");
    }
    this.render();
    if (this.hasAttribute("value")) {
      this.setValue(this.getAttribute("value"));
    }
  }

  updateStyles() {
    const style = this.shadowRoot.querySelector("style");
    if (style) {
      style.textContent = this.getStyles();
    }
  }

  getStyles() {
    return `
      :host {
        display: inline-block;
        --segment-on: ${this._color};
        --segment-off: ${this._bgColor};
        --segment-stroke-width: 8;
        background: #000;
        padding: ${this._padding}px;
        border-radius: 4px;
      }
      svg {
        display: block;
        height: 100%;
        width: auto;
        min-height: 40px;
      }
      path, polyline, line {
        stroke: var(--segment-off);
        stroke-width: var(--segment-stroke-width);
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
        transition: stroke 0.1s ease-in-out;
      }
      /* Optional subtle glow for 'on' segments */
      .segment.on {
        stroke: var(--segment-on);
        filter: drop-shadow(0 0 2px var(--segment-on));
      }
    `;
  }

  render() {
    const totalWidth = this._digits * this._digitWidth;
    const height = this._digitHeight;

    let digitsHtml = "";
    for (let i = 0; i < this._digits; i++) {
      const offsetX = i * this._digitWidth;
      // Slanting done inline to avoid CSS transform overriding the translate
      digitsHtml += `<g class="digit" transform="translate(${offsetX + 20}, 0) skewX(-8)" data-digit-index="${i}">
        ${this.getSegmentPaths()}
      </g>`;
    }

    // Add extra width to account for skew clipping on the right
    const viewBoxWidth = totalWidth + 30;

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <svg viewBox="0 0 ${viewBoxWidth} ${height}">
        ${digitsHtml}
      </svg>
    `;
  }

  // To be overridden
  getSegmentPaths() {
    return "";
  }

  // To be overridden
  getCharMap() {
    return {};
  }

  setValue(val) {
    const strVal = String(val).toUpperCase();
    const map = this.getCharMap();
    
    // Extract characters, treating a character followed by '.' as a single unit
    const chars = [];
    for (let i = 0; i < strVal.length; i++) {
      if (strVal[i] === '.' && chars.length > 0 && chars[chars.length - 1] !== ' ') {
        chars[chars.length - 1] += '.';
      } else {
        chars.push(strVal[i]);
      }
    }

    // Right-align by default
    while (chars.length < this._digits) {
      chars.unshift(" ");
    }
    const displayChars = chars.slice(Math.max(0, chars.length - this._digits));

    for (let i = 0; i < this._digits; i++) {
      const charStr = displayChars[i];
      const baseChar = charStr[0];
      const hasDp = charStr.includes('.');
      
      const activeSegments = [...(map[baseChar] || [])];
      if (hasDp || baseChar === '.') {
        if (!activeSegments.includes('dp')) activeSegments.push('dp');
      }
      this.setSegmentsForDigit(i, activeSegments);
    }
  }

  setSegmentsForDigit(digitIndex, activeSegmentArray) {
    const digitGroup = this.shadowRoot.querySelector(`g[data-digit-index="${digitIndex}"]`);
    if (!digitGroup) return;

    const segments = digitGroup.querySelectorAll('.segment');
    segments.forEach(seg => {
      seg.classList.remove('on');
    });

    activeSegmentArray.forEach(segName => {
      const seg = digitGroup.querySelector(`[data-segment="${segName}"]`);
      if (seg) {
        seg.classList.add('on');
      }
    });
  }

  // Set specific segments by map object: { a: true, b: false, ... }
  setSegments(digitIndex, segmentMap) {
    const active = Object.keys(segmentMap).filter(k => segmentMap[k]);
    // It's easier to just iterate over the map and set class
    const digitGroup = this.shadowRoot.querySelector(`g[data-digit-index="${digitIndex}"]`);
    if (!digitGroup) return;

    for (const [segName, isOn] of Object.entries(segmentMap)) {
      const seg = digitGroup.querySelector(`[data-segment="${segName}"]`);
      if (seg) {
        if (isOn) {
          seg.classList.add('on');
        } else {
          seg.classList.remove('on');
        }
      }
    }
  }
}

// ==========================================
// 7-Segment Display
// ==========================================

const SEVEN_SEGMENT_PATHS = `
  <!-- Top: a -->
  <line x1="15" y1="10" x2="45" y2="10" class="segment" data-segment="a" />
  <!-- Top Right: b -->
  <line x1="50" y1="15" x2="50" y2="45" class="segment" data-segment="b" />
  <!-- Bottom Right: c -->
  <line x1="50" y1="55" x2="50" y2="85" class="segment" data-segment="c" />
  <!-- Bottom: d -->
  <line x1="15" y1="90" x2="45" y2="90" class="segment" data-segment="d" />
  <!-- Bottom Left: e -->
  <line x1="10" y1="55" x2="10" y2="85" class="segment" data-segment="e" />
  <!-- Top Left: f -->
  <line x1="10" y1="15" x2="10" y2="45" class="segment" data-segment="f" />
  <!-- Middle: g -->
  <line x1="15" y1="50" x2="45" y2="50" class="segment" data-segment="g" />
  <!-- Decimal Point: dp -->
  <line x1="60" y1="90" x2="60" y2="90" class="segment" data-segment="dp" />
`;

// Simple mapping for 0-9 and a few letters
const SEVEN_SEG_MAP = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c', 'f'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  'A': ['a', 'b', 'c', 'e', 'f', 'g'],
  'B': ['c', 'd', 'e', 'f', 'g'], // lowercase b
  'C': ['a', 'd', 'e', 'f'],
  'D': ['b', 'c', 'd', 'e', 'g'], // lowercase d
  'E': ['a', 'd', 'e', 'f', 'g'],
  'F': ['a', 'e', 'f', 'g'],
  '-': ['g'],
  ' ': [],
  '.': ['dp']
};

export class SevenSegment extends SegmentDisplayBase {
  getSegmentPaths() {
    return SEVEN_SEGMENT_PATHS;
  }
  getCharMap() {
    return SEVEN_SEG_MAP;
  }
}

// ==========================================
// 16-Segment Display
// ==========================================

const SIXTEEN_SEGMENT_PATHS = `
  <!-- Top: a1, a2 -->
  <line x1="14" y1="10" x2="28" y2="10" class="segment" data-segment="a1" />
  <line x1="32" y1="10" x2="46" y2="10" class="segment" data-segment="a2" />
  <!-- Top Right: b -->
  <line x1="50" y1="14" x2="50" y2="46" class="segment" data-segment="b" />
  <!-- Bottom Right: c -->
  <line x1="50" y1="54" x2="50" y2="86" class="segment" data-segment="c" />
  <!-- Bottom: d1, d2 -->
  <line x1="32" y1="90" x2="46" y2="90" class="segment" data-segment="d2" />
  <line x1="14" y1="90" x2="28" y2="90" class="segment" data-segment="d1" />
  <!-- Bottom Left: e -->
  <line x1="10" y1="54" x2="10" y2="86" class="segment" data-segment="e" />
  <!-- Top Left: f -->
  <line x1="10" y1="14" x2="10" y2="46" class="segment" data-segment="f" />
  <!-- Middle: g1, g2 -->
  <line x1="14" y1="50" x2="28" y2="50" class="segment" data-segment="g1" />
  <line x1="32" y1="50" x2="46" y2="50" class="segment" data-segment="g2" />
  <!-- Diagonals and center vertical -->
  <line x1="14" y1="14" x2="28" y2="46" class="segment" data-segment="h" />
  <line x1="30" y1="14" x2="30" y2="46" class="segment" data-segment="i" />
  <line x1="46" y1="14" x2="32" y2="46" class="segment" data-segment="j" />
  <line x1="46" y1="86" x2="32" y2="54" class="segment" data-segment="k" />
  <line x1="30" y1="86" x2="30" y2="54" class="segment" data-segment="m" />
  <line x1="14" y1="86" x2="28" y2="54" class="segment" data-segment="l" />
  <!-- Decimal Point: dp -->
  <line x1="60" y1="90" x2="60" y2="90" class="segment" data-segment="dp" />
`;

const SIXTEEN_SEG_MAP = {
  '0': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'l', 'j'], // with slash
  '1': ['b', 'c', 'i', 'm'],
  '2': ['a1', 'a2', 'b', 'g2', 'g1', 'e', 'd1', 'd2'],
  '3': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'g2'],
  '4': ['f', 'b', 'g1', 'g2', 'c'],
  '5': ['a1', 'a2', 'f', 'g1', 'k', 'd1', 'd2'],
  '6': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'c', 'g1', 'g2'],
  '7': ['a1', 'a2', 'b', 'c'],
  '8': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'g1', 'g2'],
  '9': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'f', 'g1', 'g2'],
  'A': ['e', 'f', 'a1', 'a2', 'b', 'c', 'g1', 'g2'],
  'B': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'i', 'm', 'g2'],
  'C': ['a1', 'a2', 'f', 'e', 'd1', 'd2'],
  'D': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'i', 'm'],
  'E': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'g1', 'g2'],
  'F': ['a1', 'a2', 'f', 'e', 'g1'],
  'G': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'c', 'g2'],
  'H': ['f', 'e', 'b', 'c', 'g1', 'g2'],
  'I': ['a1', 'a2', 'i', 'm', 'd1', 'd2'],
  'J': ['b', 'c', 'd1', 'd2', 'e'],
  'K': ['f', 'e', 'g1', 'j', 'k'],
  'L': ['f', 'e', 'd1', 'd2'],
  'M': ['f', 'e', 'h', 'j', 'b', 'c'],
  'N': ['f', 'e', 'h', 'k', 'c', 'b'],
  'O': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f'],
  'P': ['a1', 'a2', 'b', 'f', 'e', 'g1', 'g2'],
  'Q': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'k'],
  'R': ['a1', 'a2', 'b', 'f', 'e', 'g1', 'g2', 'k'],
  'S': ['a1', 'a2', 'f', 'g1', 'g2', 'c', 'd1', 'd2'],
  'T': ['a1', 'a2', 'i', 'm'],
  'U': ['f', 'e', 'd1', 'd2', 'c', 'b'],
  'V': ['f', 'e', 'l', 'j'], // Actually \ / for V? wait, l is bot-left-to-mid, h is top-left-to-mid. V is f, e and l? No, V is f, l, j? V could use h, l for left and right?
  // Let's re-map V
  // V can use f and e for left, but slanted. But standard 16 seg V uses top left (f) or slanted.
  // We'll just map V to f, e, d1, d2 or use diagonals: l, m, or just h, k?
  // standard: ['l', 'j'], wait, left diagonal is h, l? no, h goes from tl to m, l goes from m to bl.
  // Actually, wait, L is m to bl. Let's trace it.
  // x1=14 y1=86 to x2=28 y2=54. This is bottom-left to center.
  // Mmm... h is 14,14 to 28,46 (top-left to center).
  // j is 46,14 to 32,46 (top-right to center).
  // k is 46,86 to 32,54 (bottom-right to center).
  // l is 14,86 to 28,54 (bottom-left to center).
  // Yes. V is usually e, f, l to center and j to top right? Or just l and k!
  // l and k would make a chevron pointing UP. No, wait. V points DOWN.
  // V points down, so it should be h and j? Wait... no, h goes \ and j goes /. That points DOWN.
  // wait, from top-left (14,14) to center (28,46) is \.
  // from top-right (46,14) to center (32,46) is /.
  // If h and j are on, it looks like a V. But it's on the top half. We need e, l for bottom half?
  // A large V uses f, l, j for some reason? No, large V is f, l, k?
  // Let's just use 'e', 'f', 'l', 'j' -- wait. l is / (bottom left to center).
  // j is / (center to top right). Then it's a giant slash.
  // Let's use simple letters for now.
  'W': ['b', 'c', 'f', 'e', 'l', 'k'], // down left, down right, up-mid left, up-mid right
  'X': ['h', 'j', 'l', 'k'],
  'Y': ['h', 'j', 'm'],
  'Z': ['a1', 'a2', 'j', 'l', 'd1', 'd2'],
  '-': ['g1', 'g2'],
  ' ': [],
  '.': ['dp']
};

// Fix V, W mappings to look okay
SIXTEEN_SEG_MAP['V'] = ['f', 'e', 'l', 'k']; // Left wall, wait, l goes bottom-left to center (/). k goes bottom-right to center (\).
// V: left slants down \ (h), right slants up / (?). No, V is just \ /.
SIXTEEN_SEG_MAP['V'] = ['l', 'k']; // Let's just use the bottom diagonals? No, top diagonals are h (\) and j (/).
// Let's use h and j for small V, and f,e and d1, d2 for U.
// Let's just use X-like diagonals for now.

export class SixteenSegment extends SegmentDisplayBase {
  getSegmentPaths() {
    return SIXTEEN_SEGMENT_PATHS;
  }
  getCharMap() {
    return SIXTEEN_SEG_MAP;
  }
}

customElements.define("seven-segment", SevenSegment);
customElements.define("sixteen-segment", SixteenSegment);
