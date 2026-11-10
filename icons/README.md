# Extension Icons

This directory should contain the extension icons in PNG format.

## Required Icons

The manifest.json expects the following icon sizes:
- `icon16.png` - 16×16 pixels (toolbar icon)
- `icon48.png` - 48×48 pixels (extension management page)
- `icon128.png` - 128×128 pixels (Chrome Web Store)

## Creating Icons

You can create icons using any of these methods:

### Option 1: Use an Online Tool
1. Visit [favicon.io](https://favicon.io) or similar service
2. Create icons with your design (suggestion: robot brain 🤖 with "2CP" text)
3. Download and rename to the sizes above

### Option 2: Use Image Editor
1. Create a 128×128 px image in Photoshop, GIMP, or Figma
2. Design your icon (transparent background recommended)
3. Export/resize to 16×16, 48×48, and 128×128

### Option 3: Use Command Line (ImageMagick)
If you have a source image (source.png):

```bash
# Install ImageMagick (macOS)
brew install imagemagick

# Resize to required dimensions
convert source.png -resize 16x16 icon16.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```

## Design Suggestions

### Theme
- Purple/gradient colors matching the extension UI (#667eea to #764ba2)
- Robot or AI symbol (🤖)
- Brain icon
- "2CP" or "2C" text
- Trivia/quiz related imagery

### Best Practices
- Keep it simple and recognizable
- Use transparent background
- Ensure visibility at 16×16 size
- Match brand colors
- Make it distinctive in toolbar

## Temporary Placeholder

Until you create custom icons, you can use simple placeholder images or the extension will use Chrome's default icon.

To generate simple colored squares as placeholders:

```bash
# macOS/Linux with ImageMagick
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```

## Testing Icons

After adding icons:
1. Reload the extension in chrome://extensions/
2. Check toolbar for icon16.png
3. Check extension management page for icon48.png
4. The 128px icon is used in Chrome Web Store listings
