import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';

const root = path.resolve(__dirname, '..');
const files = {
  app: fs.readFileSync(path.join(root, 'app.html'), 'utf8'),
  index: fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  registration: fs.readFileSync(path.join(root, 'registration.html'), 'utf8'),
  pending: fs.readFileSync(path.join(root, 'pending-registrations.js'), 'utf8')
};

const htmlFiles = ['app', 'index', 'registration'];

describe('Responsive form, layout, and touch tasks', () => {
  it('Property 4: form inputs prevent iOS zoom with 16px font sizing', () => {
    // Feature: responsive-ui-improvements, Property 4: Form Input iOS Zoom Prevention
    for (const name of ['app', 'registration']) {
      expect(files[name]).toMatch(/input,\s*select,\s*textarea[\s\S]*font-size:\s*16px/i);
    }
  });

  it('Property 5: form layouts adapt from single-column mobile to multi-column larger screens', () => {
    // Feature: responsive-ui-improvements, Property 5: Form Layout Responsive Adaptation
    expect(files.registration).toContain('@media (max-width: 640px)');
    expect(files.registration).toContain('grid-template-columns: 1fr;');
    expect(files.registration).toContain('@media (min-width: 641px) and (max-width: 1023px)');
    expect(files.registration).toContain('grid-template-columns: 1fr 1fr;');
    expect(files.app).toContain('.grid-cols-2');
    expect(files.app).toContain('grid-template-columns: 1fr !important');
  });

  it('Property 6: native mobile controls keep browser-friendly select/input behavior', () => {
    // Feature: responsive-ui-improvements, Property 6: Native Mobile Controls
    for (const name of ['app', 'registration']) {
      expect(files[name]).toContain('touch-action: manipulation');
      expect(files[name]).toContain('-webkit-tap-highlight-color: transparent');
      expect(files[name]).not.toMatch(/appearance:\s*none/i);
    }
  });

  it('Property 7: error messages use mobile-friendly spacing and visible formatting', () => {
    // Feature: responsive-ui-improvements, Property 7: Error Message Mobile Formatting
    expect(files.registration).toContain('.error-message');
    expect(files.registration).toContain('padding: 8px');
    expect(files.registration).toContain('border-left: 3px solid');
    expect(files.app).toContain('.validation-error');
  });

  it('Property 8: content layouts stack on mobile and expand at larger breakpoints', () => {
    // Feature: responsive-ui-improvements, Property 8: Content Layout Responsive Stacking
    expect(files.app).toContain('@media (max-width: 480px)');
    expect(files.app).toContain('grid-template-columns: 1fr !important');
    expect(files.index).toContain('repeat(auto-fit, minmax');
    expect(files.pending).toContain('flex flex-col sm:flex-row');
  });

  it('Property 9: media scales without overflowing containers', () => {
    // Feature: responsive-ui-improvements, Property 9: Media Scaling and Overflow Prevention
    for (const name of htmlFiles) {
      expect(files[name]).toContain('overflow-x: hidden');
    }
    expect(files.app).toContain('img {');
    expect(files.index).toContain('img {');
  });

  it('Property 10: text readability is preserved across breakpoints', () => {
    // Feature: responsive-ui-improvements, Property 10: Text Readability Preservation
    for (const name of htmlFiles) {
      expect(files[name]).toContain('-webkit-text-size-adjust: 100%');
    }
    expect(files.app).toMatch(/font-size:\s*1[3456]px/);
    expect(files.registration).toMatch(/font-size:\s*1[2346]px/);
  });

  it('Property 11: cards and panels resize with breakpoint-specific spacing', () => {
    // Feature: responsive-ui-improvements, Property 11: Card and Panel Responsive Sizing
    expect(files.app).toContain('.glass-card');
    expect(files.app).toContain('@media (max-width: 360px)');
    expect(files.registration).toContain('.glass-card');
    expect(files.registration).toContain('@media (max-width: 400px)');
  });

  it('Property 12: tables provide horizontal scrolling on narrow screens', () => {
    // Feature: responsive-ui-improvements, Property 12: Table Responsive Transformation
    expect(files.app).toContain('overflow-x-auto');
    expect(files.app).toContain('-webkit-overflow-scrolling: touch');
    expect(files.pending).toContain('overflow-x-auto');
  });

  it('Property 3: touch targets keep a 44px minimum size', () => {
    // Feature: responsive-ui-improvements, Property 3: Touch Target Size Compliance
    fc.assert(
      fc.property(fc.constantFrom(...htmlFiles), (name) => {
        expect(files[name]).toContain('min-height: 44px');
        expect(files[name]).toMatch(/min-width:\s*(44px|var\(--min-touch-target\))/);
      }),
      { numRuns: 30 }
    );
  });

  it('Property 17 and 18: touch equivalents and smooth scrolling are implemented', () => {
    // Feature: responsive-ui-improvements, Property 17: Touch Interaction Equivalents
    // Feature: responsive-ui-improvements, Property 18: Smooth Touch Scrolling
    for (const name of htmlFiles) {
      expect(files[name]).toContain('touch-action: manipulation');
      expect(files[name]).toContain('user-select: none');
    }
    expect(files.app).toContain('-webkit-overflow-scrolling: touch');
  });
});
