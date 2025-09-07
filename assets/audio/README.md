# 🎵 Music Files Directory

## How to Add Songs to Your Music Player

### 1. **Add Audio Files**
Place your MP3 files in this directory (`assets/audio/`):
```
assets/audio/
├── our-song.mp3
├── love-song.mp3
├── memories.mp3
└── your-song.mp3
```

### 2. **Add Album Artwork**
Place album artwork in the `assets/images/album-artwork/` directory:
```
assets/images/album-artwork/
├── our-song.jpg
├── love-song.jpg
├── memories.jpg
└── your-song.jpg
```

### 3. **Update Music Library**
Edit `data/music-library.json` to add your song details:

```json
{
  "id": "song_004",
  "title": "Your Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": "3:45",
  "file": "assets/audio/your-song.mp3",
  "artwork": "assets/images/album-artwork/your-song.jpg",
  "genre": "Genre",
  "year": "2024",
  "favorite": false,
  "playCount": 0,
  "lastPlayed": null
}
```

### 4. **Supported Formats**
- **Audio**: MP3, WAV, OGG, M4A
- **Images**: JPG, JPEG, PNG, WebP
- **Max File Size**: 50MB per file

### 5. **File Naming Convention**
- Use lowercase with hyphens: `my-song.mp3`
- Keep names short and descriptive
- Avoid special characters and spaces

### 6. **Default Artwork**
If no artwork is provided, the system will use the default placeholder image.

---

**Note**: This is a static website, so all files must be uploaded to your hosting service (GitHub Pages, Netlify, etc.) for the music player to work.
