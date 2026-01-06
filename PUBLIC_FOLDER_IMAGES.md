# Public Folder Images Required

## PWA Icons (Required for PWA Installation)

You need **2 icon files** in the `public/icons/` folder:

### Required Icons:
1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels

### How to Generate Icons:

#### Option 1: Online Generator (Easiest)
1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload a square image (at least 512x512px)
3. Download the generated icons
4. Place `android-chrome-192x192.png` as `icon-192x192.png`
5. Place `android-chrome-512x512.png` as `icon-512x512.png`
6. Put both in `public/icons/` folder

#### Option 2: Manual Creation
1. Create a square logo/image (512x512px minimum)
2. Resize to 192x192px → save as `public/icons/icon-192x192.png`
3. Resize to 512x512px → save as `public/icons/icon-512x512.png`

### Icon Design Tips:
- Use a music-related icon or your app logo
- Use solid colors or gradients (matches your app theme)
- Ensure it looks good on both light and dark backgrounds
- Keep it simple and recognizable at small sizes

### File Structure:
```
public/
├── icons/
│   ├── icon-192x192.png  ← Required
│   └── icon-512x512.png  ← Required
├── manifest.json
└── robots.txt
```

### Quick Test:
After adding icons, check:
- `http://localhost:3000/icons/icon-192x192.png` should load
- `http://localhost:3000/icons/icon-512x512.png` should load

## Optional Icons (For Better PWA Support)

If you want full PWA support across all devices, you can also add:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-384x384.png`

But **only 2 are required** for basic PWA functionality (192x192 and 512x512).

## Summary

**Minimum Required: 2 icon files**
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`

That's it! These are the only images you need in the public folder for the app to work properly.
