const { test, expect } = require('@playwright/test');

test.describe('Segment Displays', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the local page
    await page.goto('http://localhost:8080/');
  });

  test('seven-segment component renders correctly', async ({ page }) => {
    // Wait for the elements to be defined and rendered
    const display = page.locator('seven-segment').first();
    await expect(display).toBeVisible();

    // Check if Shadow DOM exists
    const svg = display.locator('svg');
    await expect(svg).toBeVisible();
    
    // Check digit rendering
    const digits = display.locator('g.digit');
    expect(await digits.count()).toBeGreaterThan(0);
  });

  test('seven-segment sets right active segments for number 1', async ({ page }) => {
    const display = page.locator('seven-segment').first();
    
    // Evaluate in browser to set the value
    await display.evaluate((node) => {
      node.setAttribute('digits', '1');
      node.setValue('1');
    });

    // Check that only segments b and c are 'on'
    const digitGroup = display.locator('g.digit[data-digit-index="0"]');
    
    const segB = digitGroup.locator('[data-segment="b"]');
    const segC = digitGroup.locator('[data-segment="c"]');
    const segA = digitGroup.locator('[data-segment="a"]');

    await expect(segB).toHaveClass(/on/);
    await expect(segC).toHaveClass(/on/);
    await expect(segA).not.toHaveClass(/on/);
  });

  test('sixteen-segment sets right active segments for letter A', async ({ page }) => {
    const display = page.locator('sixteen-segment').first();
    
    await display.evaluate((node) => {
      node.setAttribute('digits', '1');
      node.setValue('A');
    });

    const digitGroup = display.locator('g.digit[data-digit-index="0"]');
    
    // 'A': ['e', 'f', 'a1', 'a2', 'b', 'c', 'g1', 'g2']
    const expectedOn = ['e', 'f', 'a1', 'a2', 'b', 'c', 'g1', 'g2'];
    
    for (const segment of expectedOn) {
      await expect(digitGroup.locator(`[data-segment="${segment}"]`)).toHaveClass(/on/);
    }

    // Check a segment that should be off
    await expect(digitGroup.locator('[data-segment="d1"]')).not.toHaveClass(/on/);
  });

  test('handles decimal point correctly without taking up an extra digit space', async ({ page }) => {
    const display = page.locator('seven-segment').first();
    
    await display.evaluate((node) => {
      // 3 digits
      node.setAttribute('digits', '3');
      // Set value 1.23, which visually uses 3 characters (1+dp, 2, 3)
      node.setValue('1.23');
    });

    // Digit 0 should be '1' WITH decimal point
    const digit0 = display.locator('g.digit[data-digit-index="0"]');
    await expect(digit0.locator('[data-segment="b"]')).toHaveClass(/on/);
    await expect(digit0.locator('[data-segment="dp"]')).toHaveClass(/on/);

    // Digit 1 should be '2' WITHOUT decimal point
    const digit1 = display.locator('g.digit[data-digit-index="1"]');
    await expect(digit1.locator('[data-segment="a"]')).toHaveClass(/on/); // 2 has 'a'
    await expect(digit1.locator('[data-segment="dp"]')).not.toHaveClass(/on/);

    // Digit 2 should be '3' WITHOUT decimal point
    const digit2 = display.locator('g.digit[data-digit-index="2"]');
    await expect(digit2.locator('[data-segment="a"]')).toHaveClass(/on/); // 3 has 'a'
    await expect(digit2.locator('[data-segment="dp"]')).not.toHaveClass(/on/);
  });
});
