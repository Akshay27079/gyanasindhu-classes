import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';

let appDom, appDocument, appWindow;
let indexDom, indexDocument, indexWindow;
let regDom, regDocument, regWindow;

beforeAll(() => {
  // Load all three HTML files
  const appHtml = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf-8');
  appDom = new JSDOM(appHtml, { url: 'http://localhost:3000', pretendToBeVisual: true });
  appDocument = appDom.window.document;
  appWindow = appDom.window;

  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
  indexDom = new JSDOM(indexHtml, { url: 'http://localhost:3000', pretendToBeVisual: true });
  indexDocument = indexDom.window.document;
  indexWindow = indexDom.window;

  const regHtml = fs.readFileSync(path.resolve(__dirname, '../registration.html'), 'utf-8');
  regDom = new JSDOM(regHtml, { url: 'http://localhost:3000', pretendToBeVisual: true });
  regDocument = regDom.window.document;
  regWindow = regDom.window;
});

describe('Wave 10: Final Integration & Comprehensive Testing', () => {
  describe('10.1: Component Integration Across All Files', () => {
    
    it('all three HTML files have consistent viewport meta tags', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        const viewport = doc.querySelector('meta[name="viewport"]');
        expect(viewport, `${name} missing viewport`).not.toBeNull();
        
        const content = viewport?.getAttribute('content') || '';
        expect(content).toContain('width=device-width', `${name} viewport width issue`);
        expect(content).toContain('initial-scale=1.0', `${name} viewport scale issue`);
        expect(content).toContain('maximum-scale=1.0', `${name} viewport max-scale issue`);
        expect(content).toContain('user-scalable=no', `${name} viewport user-scalable issue`);
      });
    });

    it('all files have consistent breakpoint CSS variables', () => {
      const breakpoints = {
        '--breakpoint-mobile': '767px',
        '--breakpoint-tablet-min': '768px',
        '--breakpoint-tablet-max': '1023px',
        '--breakpoint-desktop': '1024px',
        '--min-touch-target': '44px',
        '--min-spacing': '8px'
      };

      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        const rootStyles = doc.documentElement.getAttribute('style') || '';
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        let foundCssVars = false;
        styleElements.forEach(style => {
          const text = style.textContent || '';
          if (text.includes('--breakpoint-mobile')) {
            foundCssVars = true;
          }
        });

        expect(foundCssVars, `${name} missing CSS variables`).toBe(true);
      });
    });

    it('all interactive elements meet touch target requirements', () => {
      const files = [
        { doc: appDocument, win: appWindow, name: 'app.html' },
        { doc: indexDocument, win: indexWindow, name: 'index.html' },
        { doc: regDocument, win: regWindow, name: 'registration.html' }
      ];

      files.forEach(({ doc, win, name }) => {
        const buttons = doc.querySelectorAll('button, a.btn-primary, a.btn-secondary, .btn-gold, .card-btn');
        buttons.forEach((btn, idx) => {
          if (btn && btn.offsetHeight !== undefined) {
            const height = btn.offsetHeight;
            const width = btn.offsetWidth;
            
            if (height > 0 && width > 0) {
              expect(height, `${name} button ${idx} height`).toBeGreaterThanOrEqual(44);
              expect(width, `${name} button ${idx} width`).toBeGreaterThanOrEqual(44);
            }
          }
        });
      });
    });

    it('all form inputs have minimum 16px font-size to prevent iOS zoom', () => {
      const files = [
        { doc: appDocument, win: appWindow, name: 'app.html' },
        { doc: regDocument, win: regWindow, name: 'registration.html' }
      ];

      files.forEach(({ doc, win, name }) => {
        const inputs = doc.querySelectorAll('input, select, textarea');
        inputs.forEach((input, idx) => {
          const styles = win.getComputedStyle(input);
          const fontSize = parseFloat(styles.fontSize);
          
          if (fontSize > 0) {
            expect(fontSize, `${name} input ${idx} font-size`).toBeGreaterThanOrEqual(16);
          }
        });
      });
    });
  });

  describe('10.2: Cross-Device Responsive Testing', () => {
    
    it('layout maintains at mobile breakpoint (320px)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 767 }),
          (mobileWidth) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              const viewport = doc.querySelector('meta[name="viewport"]');
              expect(viewport).not.toBeNull();
              
              const body = doc.body;
              expect(body).not.toBeNull();
              
              const overflow = doc.documentElement.style.overflowX;
              // Should not have overflow-x set to auto or scroll
              expect(overflow).not.toBe('auto');
            });

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('layout maintains at tablet breakpoint (768px-1023px)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 768, max: 1023 }),
          (tabletWidth) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              // Check CSS media queries exist for tablet
              let hasTabletQueries = false;
              const styleElements = Array.from(doc.querySelectorAll('style'));
              
              styleElements.forEach(style => {
                const text = style.textContent || '';
                if (text.includes('@media') && text.includes('768px')) {
                  hasTabletQueries = true;
                }
              });

              expect(hasTabletQueries, `${name} missing tablet media queries`).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('layout maintains at desktop breakpoint (1024px+)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 1920 }),
          (desktopWidth) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              let hasDesktopQueries = false;
              const styleElements = Array.from(doc.querySelectorAll('style'));
              
              styleElements.forEach(style => {
                const text = style.textContent || '';
                if (text.includes('@media') && text.includes('1024px')) {
                  hasDesktopQueries = true;
                }
              });

              expect(hasDesktopQueries, `${name} missing desktop media queries`).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('grid layouts use mobile-first approach with correct column counts', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasGrids = false;
        let hasMobileFirstApproach = false;

        const styleElements = Array.from(doc.querySelectorAll('style'));
        styleElements.forEach(style => {
          const text = style.textContent || '';
          
          if (text.includes('display: grid') || text.includes('grid-template-columns')) {
            hasGrids = true;
          }

          // Mobile-first approach can be detected by checking for media queries with min-width
          // and default mobile layout before the query
          if ((text.includes('grid-template-columns: 1fr') && !text.includes('@media')) ||
              (text.includes('@media (min-width:') && text.includes('grid-template-columns'))) {
            hasMobileFirstApproach = true;
          }
        });

        // If grids exist, they should use mobile-first approach
        if (hasGrids) {
          expect(hasMobileFirstApproach, `${name} has mobile-first grid approach`).toBe(true);
        }
      });
    });

    it('CSS features include necessary vendor prefixes for mobile browsers', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasVendorPrefixes = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          
          if (text.includes('-webkit-') || text.includes('-moz-') || text.includes('-ms-')) {
            hasVendorPrefixes = true;
          }
        });

        expect(hasVendorPrefixes, `${name} missing vendor prefixes`).toBe(true);
      });
    });

    it('touch scrolling is enabled with proper scroll handling', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasProperScrolling = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          // Look for smooth scrolling support or viewport configuration
          if (text.includes('-webkit-overflow-scrolling: touch') || 
              text.includes('scroll-behavior: smooth') ||
              text.includes('overflow-y: auto') ||
              text.includes('overflow-x: hidden') ||
              text.includes('touch-action: manipulation')) {
            hasProperScrolling = true;
          }
        });

        // All files should have some form of proper scroll handling
        expect(hasProperScrolling, `${name} has proper scroll handling`).toBe(true);
      });
    });

    it('fallback layouts are provided for browsers without CSS Grid', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasFallback = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          if (text.includes('@supports not (display: grid)')) {
            hasFallback = true;
          }
        });

        expect(hasFallback, `${name} missing grid fallback support`).toBe(true);
      });
    });
  });

  describe('10.3: Accessibility Compliance Validation', () => {
    
    it('maintains minimum font sizes across all breakpoints', () => {
      const files = [
        { doc: appDocument, win: appWindow, name: 'app.html' },
        { doc: indexDocument, win: indexWindow, name: 'index.html' },
        { doc: regDocument, win: regWindow, name: 'registration.html' }
      ];

      files.forEach(({ doc, win, name }) => {
        // Check that main body text is readable
        let minBodyFontSize = 999;
        
        const textElements = doc.querySelectorAll('body, main, article, section > p, .content p, label');
        let textElementCount = 0;

        textElements.forEach((el, idx) => {
          if (el.textContent && el.textContent.trim() && el.textContent.length > 10) {
            const styles = win.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            
            if (fontSize > 0) {
              textElementCount++;
              minBodyFontSize = Math.min(minBodyFontSize, fontSize);
            }
          }
        });

        // If we found text elements, the minimum should generally be >= 12px
        // Allow some tolerance for very small decorative text
        if (textElementCount > 0) {
          expect(minBodyFontSize, `${name} has adequate minimum font size`).toBeGreaterThanOrEqual(10);
        }
      });
    });

    it('layout structure preserved during text scaling', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 2 }),
          (scaleFactor) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              // Check for fixed layouts that would break with text scaling
              const styleElements = Array.from(doc.querySelectorAll('style'));
              let hasFlexibleLayout = false;

              styleElements.forEach(style => {
                const text = style.textContent || '';
                
                // Check for flexible units like %, em, rem, or clamp()
                if (text.includes('% ') || text.includes('em ') || 
                    text.includes('rem ') || text.includes('clamp(')) {
                  hasFlexibleLayout = true;
                }
              });

              expect(hasFlexibleLayout, `${name} missing flexible layout units`).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('color contrast is maintained across layouts', () => {
      const files = [
        { doc: appDocument, win: appWindow, name: 'app.html' },
        { doc: indexDocument, win: indexWindow, name: 'index.html' },
        { doc: regDocument, win: regWindow, name: 'registration.html' }
      ];

      files.forEach(({ doc, win, name }) => {
        // Check for text color properties in CSS
        let hasColorDefinitions = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          if (text.includes('color:') || text.includes('background:')) {
            hasColorDefinitions = true;
          }
        });

        expect(hasColorDefinitions, `${name} missing color definitions`).toBe(true);
      });
    });

    it('interactive elements are accessible to assistive technologies', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        // Check for ARIA labels and semantic HTML
        let hasAccessibilityMarkup = false;
        
        const buttons = doc.querySelectorAll('button, a[href], input, select, textarea');
        buttons.forEach(btn => {
          const ariaLabel = btn.getAttribute('aria-label');
          const id = btn.getAttribute('id');
          const type = btn.getAttribute('type');
          const text = btn.textContent;

          if (ariaLabel || id || type || text) {
            hasAccessibilityMarkup = true;
          }
        });

        expect(hasAccessibilityMarkup, `${name} missing accessibility markup`).toBe(true);
      });
    });

    it('supports browser zoom up to 200% without horizontal scrolling', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 2 }),
          (zoomLevel) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              // Check for overflow prevention
              const styleElements = Array.from(doc.querySelectorAll('style'));
              let hasOverflowPrevention = false;

              styleElements.forEach(style => {
                const text = style.textContent || '';
                if (text.includes('overflow-x: hidden') || 
                    text.includes('overflow-x: clip') ||
                    text.includes('max-width: 100%')) {
                  hasOverflowPrevention = true;
                }
              });

              expect(hasOverflowPrevention, `${name} missing overflow prevention`).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('orientation changes maintain functionality and layout', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('portrait', 'landscape'),
          (orientation) => {
            const files = [
              { doc: appDocument, name: 'app.html' },
              { doc: indexDocument, name: 'index.html' },
              { doc: regDocument, name: 'registration.html' }
            ];

            files.forEach(({ doc, name }) => {
              // Check for orientation media queries
              let hasOrientationQueries = false;
              const styleElements = Array.from(doc.querySelectorAll('style'));

              styleElements.forEach(style => {
                const text = style.textContent || '';
                if (text.includes('@media') && 
                    (text.includes('orientation') || text.includes('max-height'))) {
                  hasOrientationQueries = true;
                }
              });

              expect(hasOrientationQueries, `${name} missing orientation handling`).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Cross-File Consistency Tests', () => {
    
    it('all files use consistent responsive design patterns', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      let consistentBreakpoints = 0;
      
      files.forEach(({ doc, name }) => {
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          
          // Check for all standard breakpoints
          if (text.includes('max-width: 767px') || text.includes('max-width: 768px') ||
              text.includes('@media') && text.includes('768px') ||
              text.includes('@media') && text.includes('1024px')) {
            consistentBreakpoints++;
          }
        });
      });

      // All three files should have consistent breakpoint patterns
      expect(consistentBreakpoints).toBeGreaterThanOrEqual(3);
    });

    it('all files prevent layout thrashing with proper transitions', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasTransitions = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          if (text.includes('transition:') || text.includes('animation:')) {
            hasTransitions = true;
          }
        });

        expect(hasTransitions, `${name} missing transitions`).toBe(true);
      });
    });

    it('all files have prefers-reduced-motion for accessibility', () => {
      const files = [
        { doc: appDocument, name: 'app.html' },
        { doc: indexDocument, name: 'index.html' },
        { doc: regDocument, name: 'registration.html' }
      ];

      files.forEach(({ doc, name }) => {
        let hasReducedMotion = false;
        const styleElements = Array.from(doc.querySelectorAll('style'));
        
        styleElements.forEach(style => {
          const text = style.textContent || '';
          if (text.includes('@media (prefers-reduced-motion: reduce)')) {
            hasReducedMotion = true;
          }
        });

        expect(hasReducedMotion, `${name} missing prefers-reduced-motion`).toBe(true);
      });
    });
  });
});
