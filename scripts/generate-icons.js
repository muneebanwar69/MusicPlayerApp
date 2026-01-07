/**
 * PWA Icon Generator Script
 * Run with: node scripts/generate-icons.js
 * 
 * This script generates all required PWA icons from a source SVG.
 * Requires: sharp (npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SOURCE_SVG = path.join(ICONS_DIR, 'icon-512x512.svg');

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a more detailed SVG for better quality icons
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#shine)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.22}" fill="none" stroke="white" stroke-width="${size * 0.03}" opacity="0.9"/>
    <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.08}" fill="white"/>
    <path d="M${size * 0.38} ${size * 0.18} L${size * 0.38} ${size * 0.42} L${size * 0.52} ${size * 0.3} Z" fill="white"/>
  </g>
</svg>
`;

// Create maskable icon SVG (with safe zone padding)
const createMaskableSVG = (size) => {
  const padding = size * 0.1; // 10% padding for safe zone
  const innerSize = size - (padding * 2);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g transform="translate(${padding + innerSize * 0.15}, ${padding + innerSize * 0.15})">
    <circle cx="${innerSize * 0.35}" cy="${innerSize * 0.35}" r="${innerSize * 0.28}" fill="none" stroke="white" stroke-width="${innerSize * 0.04}" opacity="0.95"/>
    <circle cx="${innerSize * 0.35}" cy="${innerSize * 0.35}" r="${innerSize * 0.1}" fill="white"/>
    <path d="M${innerSize * 0.45} ${innerSize * 0.2} L${innerSize * 0.45} ${innerSize * 0.5} L${innerSize * 0.62} ${innerSize * 0.35} Z" fill="white"/>
  </g>
</svg>
`;
};

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Generate regular icons
  for (const size of ICON_SIZES) {
    const svgContent = createSVG(size);
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`✅ Generated: icon-${size}x${size}.png`);
  }

  // Generate maskable icons
  for (const size of [192, 512]) {
    const svgContent = createMaskableSVG(size);
    const outputPath = path.join(ICONS_DIR, `maskable-icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`✅ Generated: maskable-icon-${size}x${size}.png`);
  }

  // Generate Apple touch icon
  const appleTouchSvg = createSVG(180);
  await sharp(Buffer.from(appleTouchSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('✅ Generated: apple-touch-icon.png');

  // Generate favicon
  const faviconSvg = createSVG(32);
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(__dirname, '../public/favicon.png'));
  console.log('✅ Generated: favicon.png');

  console.log('\n🎉 All icons generated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Deploy to Vercel');
  console.log('2. Open your app in Chrome/Edge');
  console.log('3. Look for the install button in the address bar or use the in-app prompt');
}

generateIcons().catch(console.error);
