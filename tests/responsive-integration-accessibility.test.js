import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';

const root = path.resolve(__dirname, '..');
const htmlFiles = ['app.html', 'index.html', 'registration.html'];
const htmlByFile = Object.fromEntries(
  htmlFiles.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')])
);

describe('Responsive performance, compatibility, accessibility, and integration tasks', () => {
  it('Property 15: breakpoint naming conventions are consistent across HTML files', () => {
    // Feature: responsive-ui-improvements, Property 15: Breakpoint Naming Convention Consistency
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('--breakpoint-mobile: 767px');
      expect(html).toContain('--breakpoint-tablet-min: 768px');
      expect(html).toContain('--breakpoint-tablet-max: 1023px');
      expect(html).toContain('--breakpoint-desktop: 1024px');
    }
  });

  it('Property 16: media queries include mobile, tablet, and desktop behavior', () => {
    // Feature: responsive-ui-improvements, Property 16: Mobile-First Media Query Structure
    expect(htmlByFile['app.html']).toContain('@media (max-width: 768px)');
    expect(htmlByFile['app.html']).toContain('@media (min-width: 769px) and (max-width: 1023px)');
    expect(htmlByFile['app.html']).toContain('@media (min-width: 1025px)');
    expect(htmlByFile['registration.html']).toContain('@media (max-width: 640px)');
    expect(htmlByFile['index.html']).toContain('@media (max-width: 768px)');
  });

  it('Property 19: responsive CSS avoids motion-heavy work when reduced motion is requested', () => {
    // Feature: responsive-ui-improvements, Property 19: Performance Optimization
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('@media (prefers-reduced-motion: reduce)');
      expect(html).toContain('transition-duration: 0.01ms');
    }
  });

  it('Property 20: images include explicit sizing and async decoding hints', () => {
    // Feature: responsive-ui-improvements, Property 20: Efficient Image Loading
    const allHtml = Object.values(htmlByFile).join('\n');
    const imageTags = allHtml.match(/<img\b[^>]*>/g) || [];
    expect(imageTags.length).toBeGreaterThan(0);
    imageTags.forEach(tag => {
      expect(tag).toMatch(/\balt=/);
      expect(tag).toMatch(/\b(width|style)=/);
      expect(tag).toMatch(/\b(height|style)=/);
      expect(tag).toContain('decoding="async"');
      expect(tag).toMatch(/loading="(lazy|eager)"/);
    });
  });

  it('Property 21 and 22: mobile browser compatibility hooks and CSS fallbacks exist', () => {
    // Feature: responsive-ui-improvements, Property 21: Cross-Browser Compatibility
    // Feature: responsive-ui-improvements, Property 22: CSS Feature Browser Support
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('-webkit-text-size-adjust: 100%');
      expect(html).toContain('-webkit-user-select: none');
      expect(html).toContain('@supports not (display: grid)');
    }
    expect(htmlByFile['app.html']).toContain('-webkit-overflow-scrolling: touch');
  });

  it('Property 23: fallback layouts are available when CSS Grid is unavailable', () => {
    // Feature: responsive-ui-improvements, Property 23: Layout Fallback Support
    expect(htmlByFile['app.html']).toContain('.grid > *');
    expect(htmlByFile['index.html']).toContain('.courses-grid > *');
    expect(htmlByFile['registration.html']).toContain('.grid-2 > *');
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('flex-wrap: wrap');
    }
  });

  it('Property 24 and 25: layout integrity survives target widths and orientation changes', () => {
    // Feature: responsive-ui-improvements, Property 24: Responsive Behavior Layout Integrity
    // Feature: responsive-ui-improvements, Property 25: Orientation Change Functionality
    fc.assert(
      fc.property(fc.constantFrom(320, 360, 480, 768, 1024, 1200), (width) => {
        const app = htmlByFile['app.html'];
        expect(app).toContain('overflow-x: hidden');
        if (width < 768) expect(app).toContain('@media (max-width: 768px)');
        if (width >= 768 && width <= 1023) expect(app).toContain('@media (min-width: 769px) and (max-width: 1023px)');
        if (width >= 1024) expect(app).toContain('@media (min-width: 1025px)');
      }),
      { numRuns: 30 }
    );
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('@media (orientation: landscape)');
    }
  });

  it('Property 26 and 27: readable font sizes and text scaling preservation are configured', () => {
    // Feature: responsive-ui-improvements, Property 26: Font Size Readability
    // Feature: responsive-ui-improvements, Property 27: Text Scaling Layout Preservation
    for (const html of Object.values(htmlByFile)) {
      expect(html).toContain('-webkit-text-size-adjust: 100%');
      expect(html).toMatch(/font-size:\s*(1[2-6]px|0\.[78]\d*rem|1rem|1\.1rem)/);
    }
  });

  it('Property 28 and 29: color contrast and assistive technology access are preserved', () => {
    // Feature: responsive-ui-improvements, Property 28: Color Contrast Maintenance
    // Feature: responsive-ui-improvements, Property 29: Assistive Technology Accessibility
    expect(htmlByFile['app.html']).toContain('aria-label="Toggle navigation menu"');
    expect(htmlByFile['app.html']).toContain('aria-expanded="false"');
    expect(htmlByFile['app.html']).toContain('aria-controls="sidebar"');
    expect(htmlByFile['app.html']).toContain("aria-live', 'polite'");
    expect(htmlByFile['index.html']).toContain('aria-label="Menu"');
    expect(htmlByFile['index.html']).toContain('aria-label="WhatsApp"');
    for (const html of Object.values(htmlByFile)) {
      expect(html).toMatch(/#[0-9a-fA-F]{3,6}/);
    }
  });

  it('Task 10.3: all responsive systems are wired together across app pages', () => {
    // Feature: responsive-ui-improvements, comprehensive integration behavior across all breakpoints
    const allHtml = Object.values(htmlByFile).join('\n');
    expect(allHtml).toContain('maximum-scale=1.0');
    expect(allHtml).toContain('user-scalable=no');
    expect(allHtml).toContain('--min-touch-target: 44px');
    expect(allHtml).toContain('touch-action: manipulation');
    expect(allHtml).toContain('overflow-x: hidden');
    expect(allHtml).toContain('@supports not (display: grid)');
    expect(allHtml).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
