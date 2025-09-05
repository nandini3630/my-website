# For My Love – Static Website

A responsive, animated, and easily extensible static website to celebrate your relationship. Add messages, photos, videos, and growth stories without code changes.

## Quick start
1. Open `index.html` in a browser (no build needed).
2. To serve locally with live reload, you can run: `npx serve .` or any static server.

## Add your song
- Put your MP3 as `assets/audio/song.mp3` (the page will enable the button automatically).

## Add messages
- Edit `data/messages.json`.
- Each message:
```json
{
  "id": "m123",
  "title": "#4",
  "content": "Your message text...",
  "tags": ["love", "promise"],
  "createdAt": "2025-09-05"
}
```

## Add photos and videos
1. Place images in `assets/images/` and videos in `assets/videos/`.
2. Reference them in `data/gallery.json`:
```json
{
  "id": "g55",
  "type": "image",
  "src": "assets/images/our-photo.jpg",
  "width": 1200,
  "height": 800,
  "caption": "Coffee date"
}
```
- For videos use `type: "video"` and optional `poster`.

## Add fights/mistakes and resolutions
- Edit `data/journey.json`:
```json
{
  "id": "j9",
  "title": "Late reply misunderstanding",
  "whatHappened": "I assumed, you felt hurt...",
  "howWeSolved": "We called and clarified...",
  "lesson": "Always ask kindly first",
  "date": "2025-09-05"
}
```

## Notes
- The site loads JSON at runtime; you can keep adding items without changing HTML.
- Gallery supports lightbox on images and inline controls on videos.
- All sections are responsive and optimized for phones first.

## Pages
- Home: overview and quick links.
- `messages.html`: sorting by newest/oldest/title and tag filtering.
- `gallery.html`: sort by date and filter by type (image/video).
- `miscommunications.html`: sort by newest/oldest/title.
- `diary.html`: calendar month view; click a day to open an entry modal. Entries live in `data/diary.json` with ISO `YYYY-MM-DD` dates.

## Credits
- Fonts: Google Fonts (Poppins)

