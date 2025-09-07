# How to Add Songs to Your Music Player

## Simple Steps to Add New Songs

### 1. Add Audio Files
Place your audio files in the `assets/audio/` directory. Supported formats:
- MP3 (recommended)
- WAV
- OGG
- M4A

### 2. Update the Music Library
Edit `data/music-library.json` and add your song information:

```json
{
  "songs": [
    {
      "title": "Your Song Title",
      "artist": "Artist Name",
      "duration": "3:45",
      "file": "assets/audio/your-song.mp3",
      "artwork": "assets/images/music-placeholder.jpg"
    }
  ]
}
```

### 3. Optional: Add Custom Artwork
- Place images in `assets/images/` directory
- Supported formats: JPG, PNG, WEBP
- Update the `artwork` field in the JSON to point to your image

### Example:
```json
{
  "title": "Our Special Song",
  "artist": "Your Name",
  "duration": "4:20",
  "file": "assets/audio/our-special-song.mp3",
  "artwork": "assets/images/our-special-song.jpg"
}
```

### That's it! 
Your song will appear in the music player automatically. No complex configuration needed!

## Features Available:
- ✅ Play/Pause
- ✅ Next/Previous
- ✅ Shuffle
- ✅ Repeat
- ✅ Search songs
- ✅ Volume control
- ✅ Mobile-friendly design
- ✅ Progress bar
- ✅ Queue management

## Removed Features (for simplicity):
- ❌ Favorites (since it's static)
- ❌ Recently played tracking
- ❌ Play count tracking
- ❌ Complex library organization