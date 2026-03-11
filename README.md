# Web Components: Segment Displays

A simple, dependency-free Web Component library for rendering 7-segment and 16-segment displays using SVG.

## Components

Currently, the library provides two Custom Elements:

- `<seven-segment>`
- `<sixteen-segment>`

## Attrbutes

- `digits` (number): The number of digits/characters to render. Default is `1`.
- `color` (string): The color of the active or "turned on" segments. Default is `red`.
- `bg-color` (string): The color of the inactive or "turned off" segments. Default is `#333`.
- `value` (string): The initial value to display. Supports decimals (e.g., `1.23`), which light up the decimal point (`dp`) segment without consuming a full digit space.

## Usage

1. Include the JavaScript file in your project or HTML:

```html
<script src="segment-displays.js"></script>
```

2. Use the HTML tags wherever you need a display:

```html
<!-- 7-segment display showing a number -->
<seven-segment digits="4" value="2.45" color="#0ff"></seven-segment>

<!-- 16-segment display showing characters -->
<sixteen-segment digits="8" value="HELLO-16" color="#0f0"></sixteen-segment>
```

### Styling / Size Customization

The components are designed to be styled using CSS. The height of the component dictates its overall size, and the width scales automatically proportionally. You can also customize the thickness of the segments via a CSS custom property (`--segment-stroke-width`).

```css
/* Example: Medium sized display */
seven-segment {
  height: 50px;
  --segment-stroke-width: 8;
}

/* Example: Large sized display */
sixteen-segment {
  height: 80px;
  --segment-stroke-width: 10;
}
```

### Programmatic Control

You can also change properties dynamically via JavaScript:

```javascript
const display = document.querySelector('seven-segment');

// Change value
display.setValue("3.14");

// Manually control segments for a specific digit (0-indexed from the left)
display.setSegmentsForDigit(0, ['a', 'b', 'c', 'd', 'g']);

// Toggle specific segments on or off
display.setSegments(1, { a: true, e: false });
```

## Testing

This project uses [Playwright](https://playwright.dev/) for testing the DOM and Shadow DOM rendering of the web components.

To run the automated test suite locally:

1. Install dependencies:
```sh
npm install
```

2. Run the tests:
```sh
npm test
```
*(Or use `npx playwright test` directly)*
