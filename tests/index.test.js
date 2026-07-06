import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

let dom;
let document;

beforeAll(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
  dom = new JSDOM(html);
  document = dom.window.document;
});

describe('index.html exists', () => {
  it('index.html file exists at repository root', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../index.html'))).toBe(true);
  });
});

describe('Head assets', () => {
  it('contains Font Awesome CDN link', () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    expect(links.some(l => l.href.includes('font-awesome'))).toBe(true);
  });

  it('contains Google Fonts CDN link', () => {
    const links = Array.from(document.querySelectorAll('link[href]'));
    expect(links.some(l => l.href.includes('fonts.googleapis.com'))).toBe(true);
  });

  it('uses the local custom stylesheet in the page head', () => {
    expect(document.head.querySelector('style')).not.toBeNull();
  });
});

describe('Navigation', () => {
  it('nav contains brand text "ज्ञानसिंधू"', () => {
    const nav = document.querySelector('nav');
    expect(nav.textContent).toContain('ज्ञानसिंधू');
  });

  it('nav contains anchor link to #courses', () => {
    const nav = document.querySelector('nav');
    const links = Array.from(nav.querySelectorAll('a[href]'));
    expect(links.some(a => a.getAttribute('href') === '#courses')).toBe(true);
  });

  it('nav contains anchor link to #features', () => {
    const nav = document.querySelector('nav');
    const links = Array.from(nav.querySelectorAll('a[href]'));
    expect(links.some(a => a.getAttribute('href') === '#features')).toBe(true);
  });

  it('nav contains anchor link to #contact', () => {
    const nav = document.querySelector('nav');
    const links = Array.from(nav.querySelectorAll('a[href]'));
    expect(links.some(a => a.getAttribute('href') === '#contact')).toBe(true);
  });

  it('nav contains tel:7218432344 link', () => {
    const nav = document.querySelector('nav');
    const links = Array.from(nav.querySelectorAll('a[href]'));
    expect(links.some(a => a.getAttribute('href') === 'tel:7218432344')).toBe(true);
  });
});

describe('Hero section', () => {
  it('hero H1 contains the class brand', () => {
    const hero = document.querySelector('#hero');
    const h1 = hero.querySelector('h1');
    expect(h1.textContent).toContain('ज्ञानसिंधू');
  });

  it('hero contains fee discount stat text', () => {
    const hero = document.querySelector('#hero');
    expect(hero.textContent).toContain('२०%');
    expect(hero.textContent).toContain('फी सूट');
  });

  it('hero contains the animated star canvas', () => {
    expect(document.querySelector('#starCanvas')).not.toBeNull();
  });
});

describe('Courses section', () => {
  it('courses section has 3 cards with openPopup buttons', () => {
    const courses = document.querySelector('#courses');
    const buttons = Array.from(courses.querySelectorAll('button[onclick]'));
    const popupButtons = buttons.filter(b => b.getAttribute('onclick').includes('openPopup'));
    expect(popupButtons.length).toBe(3);
  });
});

describe('Features section', () => {
  const featureLabels = [
    'मर्यादित विद्यार्थी',
    'अनुभवी शिक्षक',
    'नोट्स व स्टडी मटेरिअल',
    'वैयक्तिक लक्ष',
    'साप्ताहिक चाचणी',
    'पालक-शिक्षक सभा',
  ];

  featureLabels.forEach(label => {
    it(`features section contains label "${label}"`, () => {
      const features = document.querySelector('#features');
      expect(features.textContent).toContain(label);
    });
  });
});

describe('CTA / Contact section', () => {
  it('contact section lists the primary phone number', () => {
    const contact = document.querySelector('#contact');
    expect(contact.textContent).toContain('7218432344');
  });

  it('contact section has wa.me WhatsApp link', () => {
    const contact = document.querySelector('#contact');
    const links = Array.from(contact.querySelectorAll('a[href]'));
    expect(links.some(a => a.getAttribute('href').includes('wa.me'))).toBe(true);
  });
});

describe('Footer', () => {
  it('footer contains address text', () => {
    const footer = document.querySelector('footer');
    expect(footer.textContent).toContain('नेरळ');
  });

  it('footer contains phone numbers', () => {
    const footer = document.querySelector('footer');
    expect(footer.textContent).toContain('7218432344');
    expect(footer.textContent).toContain('8408994618');
    expect(footer.textContent).toContain('7722055914');
  });

  it('footer contains operating hours', () => {
    const footer = document.querySelector('footer');
    expect(footer.textContent).toContain('सोमवार');
  });

  it('footer contains copyright', () => {
    const footer = document.querySelector('footer');
    expect(footer.textContent).toContain('2024');
    expect(footer.textContent).toContain('ज्ञानसिंधू');
  });
});

describe('Popup', () => {
  it('popup is closed by default', () => {
    const popup = document.querySelector('#popup');
    expect(popup.classList.contains('open')).toBe(false);
  });

  it('popup contains name input', () => {
    const popup = document.querySelector('#popup');
    expect(popup.querySelector('#f-name')).not.toBeNull();
  });

  it('popup contains phone input', () => {
    const popup = document.querySelector('#popup');
    expect(popup.querySelector('#f-phone')).not.toBeNull();
  });

  it('popup contains class input/select', () => {
    const popup = document.querySelector('#popup');
    const classInput = popup.querySelector('#f-class');
    expect(classInput).not.toBeNull();
  });
});
