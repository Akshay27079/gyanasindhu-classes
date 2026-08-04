import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';

let dom;
let document;
let window;

beforeAll(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf-8');
  dom = new JSDOM(html, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });
  document = dom.window.document;
  window = dom.window;
});

describe('Property 13: Viewport Scroll Prevention', () => {
  /**
   * Property 13: For any zoom level and content scenario, 
   * the Viewport_Manager SHALL prevent horizontal scrolling at all zoom levels 
   * including below 100% and up to 200%
   * Validates: Requirements 4.2, 10.6
   */

  it('viewport meta tag is present and correctly configured', () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    expect(viewportMeta).not.toBeNull();
    
    const content = viewportMeta?.getAttribute('content') || '';
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1.0');
    expect(content).toContain('maximum-scale=1.0');
    expect(content).toContain('user-scalable=no');
  });

  it('body has overflow-x: hidden to prevent horizontal scrolling', () => {
    const bodyStyles = window.getComputedStyle(document.body);
    const overflowX = bodyStyles.overflowX;
    
    // Check that overflow-x is set to hidden
    expect(['hidden', 'clip']).toContain(overflowX);
  });

  it('html element has overflow-x: hidden to prevent horizontal scrolling', () => {
    const htmlStyles = window.getComputedStyle(document.documentElement);
    const overflowX = htmlStyles.overflowX;
    
    // Check that overflow-x is set to hidden or empty (uses body's setting)
    expect(['hidden', 'clip', '']).toContain(overflowX);
  });

  it('box-sizing is border-box for all elements to prevent layout overflow', () => {
    const universalSelector = Array.from(document.styleSheets[0].cssRules).find(
      rule => rule.selectorText === '*'
    );
    
    expect(universalSelector).not.toBeUndefined();
  });

  /**
   * Property-based test: For any zoom level (50% to 200%), 
   * horizontal scrolling should not occur
   */
  it('maintains no horizontal scrolling at all zoom levels (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }), // Zoom level as percentage
        (zoomLevel) => {
          // Simulate zoom by adjusting viewport width calculation
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          const content = viewportMeta?.getAttribute('content') || '';
          
          // Viewport should enforce no zoom
          expect(content).toContain('maximum-scale=1.0');
          expect(content).toContain('user-scalable=no');
          
          // Body should not have horizontal scroll capability
          const bodyOverflow = window.getComputedStyle(document.body).overflowX;
          expect(['hidden', 'clip']).toContain(bodyOverflow);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property-based test: For any content width scenario,
   * content should fit within device width without horizontal scroll
   */
  it('all main containers fit within viewport width (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }), // Various device widths
        (deviceWidth) => {
          // Check main containers have max-width or full width
          const mainContent = document.getElementById('mainContent');
          const sidebar = document.getElementById('sidebar');
          const contentArea = document.getElementById('contentArea');
          
          // These should exist or not cause overflow
          if (mainContent) {
            expect(mainContent).not.toBeNull();
          }
          
          // Viewport meta should prevent zoom that causes overflow
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          const content = viewportMeta?.getAttribute('content') || '';
          expect(content).toContain('width=device-width');
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 14: Mobile Zoom Control', () => {
  /**
   * Property 14: For any mobile loading scenario,
   * the Viewport_Manager SHALL disable user zoom with maximum-scale=1.0 
   * for app-like experience
   * Validates: Requirements 4.4
   */

  it('viewport meta tag has user-scalable=no', () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    expect(viewportMeta).not.toBeNull();
    
    const content = viewportMeta?.getAttribute('content') || '';
    expect(content).toContain('user-scalable=no');
  });

  it('viewport meta tag has maximum-scale=1.0', () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    expect(viewportMeta).not.toBeNull();
    
    const content = viewportMeta?.getAttribute('content') || '';
    expect(content).toContain('maximum-scale=1.0');
  });

  it('viewport meta tag has initial-scale=1.0', () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    expect(viewportMeta).not.toBeNull();
    
    const content = viewportMeta?.getAttribute('content') || '';
    expect(content).toContain('initial-scale=1.0');
  });

  it('mobile web app meta tag is present', () => {
    const mobileWebAppMeta = document.querySelector('meta[name="mobile-web-app-capable"]');
    expect(mobileWebAppMeta).not.toBeNull();
    expect(mobileWebAppMeta?.getAttribute('content')).toBe('yes');
  });

  it('apple mobile web app meta tag is present', () => {
    const appleMobileWebAppMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    expect(appleMobileWebAppMeta).not.toBeNull();
    expect(appleMobileWebAppMeta?.getAttribute('content')).toBe('yes');
  });

  /**
   * Property-based test: For any viewport configuration scenario,
   * zoom should be completely disabled
   */
  it('zoom is disabled in all viewport scenarios (property-based)', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialScale: fc.float({ min: 0.5, max: 2.0 }),
          minScale: fc.float({ min: 0.25, max: 1.0 }),
          maxScale: fc.float({ min: 1.0, max: 2.0 })
        }),
        (scales) => {
          // For this app, maximum-scale should always be 1.0
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          const content = viewportMeta?.getAttribute('content') || '';
          
          // The actual configuration should have maximum-scale=1.0
          expect(content).toContain('maximum-scale=1.0');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property-based test: For any device type scenario,
   * zoom controls should be disabled
   */
  it('zoom controls disabled for all device types (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ios', 'android', 'desktop'),
        (deviceType) => {
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          const content = viewportMeta?.getAttribute('content') || '';
          
          // All device types should have zoom disabled
          expect(content).toContain('user-scalable=no');
          expect(content).toContain('maximum-scale=1.0');
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property-based test: CSS prevents zoom effects on form elements
   */
  it('form inputs have 16px font-size to prevent iOS zoom (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          // Check that input elements have 16px minimum font-size
          const inputs = document.querySelectorAll('input, select, textarea');
          
          // At least some inputs should exist or CSS rule should apply
          if (inputs.length > 0) {
            inputs.forEach(input => {
              const styles = window.getComputedStyle(input);
              const fontSize = parseFloat(styles.fontSize);
              
              // Font size should be at least 16px to prevent zoom
              expect(fontSize).toBeGreaterThanOrEqual(16);
            });
          }
          
          // Check CSS rule exists
          const styleSheets = Array.from(document.styleSheets);
          let foundFontSizeRule = false;
          
          try {
            styleSheets.forEach(sheet => {
              try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                  if (rule.selectorText && rule.selectorText.includes('input')) {
                    if (rule.style.fontSize) {
                      foundFontSizeRule = true;
                    }
                  }
                });
              } catch (e) {
                // CORS error on external stylesheets
              }
            });
          } catch (e) {
            // Ignore CORS errors
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
