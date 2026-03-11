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
      /* Optional labels for debugging/reference */
      text.label {
        fill: #fff;
        font-family: sans-serif;
        font-size: 10px;
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
        visibility: hidden;
      }
      :host(.show-labels) text.label {
        visibility: visible;
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

  showSegmentId() {
    // Remove any previously generated labels
    this.shadowRoot.querySelectorAll('text.label').forEach(el => el.remove());

    this.shadowRoot.querySelectorAll('.segment').forEach(seg => {
      const id = seg.getAttribute('data-segment');
      if (!id) return;

      const x1 = parseFloat(seg.getAttribute('x1'));
      const y1 = parseFloat(seg.getAttribute('y1'));
      const x2 = parseFloat(seg.getAttribute('x2'));
      const y2 = parseFloat(seg.getAttribute('y2'));
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy);
      text.setAttribute('class', 'label');
      text.textContent = id;
      seg.parentNode.insertBefore(text, seg.nextSibling);
    });
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

  <line x1="28" y1="54" x2="14" y2="86" class="segment" data-segment="k" />
  <line x1="30" y1="86" x2="30" y2="54" class="segment" data-segment="l" />
  <line x1="32" y1="54" x2="46" y2="86" class="segment" data-segment="m" />
  <!-- Decimal Point: dp -->
  <line x1="60" y1="90" x2="60" y2="90" class="segment" data-segment="dp" />
`;

const SIXTEEN_SEG_MAP = {
  '0': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'l', 'j'], // with slash
  '1': ['b', 'c'],
  '2': ['a1', 'a2', 'b', 'g2', 'g1', 'e', 'd1', 'd2'],
  '3': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'g2'],
  '4': ['f', 'b', 'g1', 'g2', 'c'],
  '5': ['a1', 'a2', 'f', 'g1', 'm', 'd1', 'd2'],
  '6': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'c', 'g1', 'g2'],
  '7': ['a1', 'a2', 'b', 'c'],
  '8': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'g1', 'g2'],
  '9': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'f', 'g1', 'g2'],
  'A': ['e', 'f', 'a1', 'a2', 'b', 'c', 'g1', 'g2'],
  'B': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'i', 'l', 'g2'],
  'C': ['a1', 'a2', 'f', 'e', 'd1', 'd2'],
  'D': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'i', 'l'],
  'E': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'g1', 'g2'],
  'F': ['a1', 'a2', 'f', 'e', 'g1'],
  'G': ['a1', 'a2', 'f', 'e', 'd1', 'd2', 'c', 'g2'],
  'H': ['f', 'e', 'b', 'c', 'g1', 'g2'],
  'I': ['a1', 'a2', 'i', 'l', 'd1', 'd2'],
  'J': ['b', 'c', 'd1', 'd2', 'e'],
  'K': ['f', 'e', 'g1', 'j', 'm'],
  'L': ['f', 'e', 'd1', 'd2'],
  'M': ['f', 'e', 'h', 'j', 'b', 'c'],
  'N': ['f', 'e', 'h', 'm', 'c', 'b'],
  'O': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f'],
  'P': ['a1', 'a2', 'b', 'f', 'e', 'g1', 'g2'],
  'Q': ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'm'],
  'R': ['a1', 'a2', 'b', 'f', 'e', 'g1', 'g2', 'm'],
  'S': ['a1', 'a2', 'f', 'g1', 'g2', 'c', 'd1', 'd2'],
  'T': ['a1', 'a2', 'i', 'l'],
  'U': ['f', 'e', 'd1', 'd2', 'c', 'b'],
  'V': ['f', 'e', 'k', 'j'],
  'W': ['b', 'c', 'f', 'e', 'k', 'm'],
  'X': ['h', 'j', 'k', 'm'],
  'Y': ['h', 'j', 'l'],
  'Z': ['a1', 'a2', 'j', 'k', 'd1', 'd2'],
  '-': ['g1', 'g2'],
  ' ': [],
  '.': ['dp']
};

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
