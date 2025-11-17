# Fuengirola Veneretket - Taustavideo

## Nykytilanne

Hero-sectionissa on taustavideo-elementti valmiina, mutta itse videotiedosto puuttuu.

## Videon lisääminen

### 1. Hae sopiva video

Lataa video jostain näistä ilmaisista lähteistä:

**Pexels.com:**
- Hae: "dolphins boat", "boat trip mediterranean", "dolphins swimming"
- Lataa MP4-muodossa

**Pixabay.com:**
- Hae: "dolphins", "boat sea", "yacht dolphins"
- Lataa video

**Unsplash.com:**
- Videos-osio
- Hae: "boat", "dolphins", "mediterranean"

### 2. Optimoi video

Ennen lisäämistä, optimoi video:

```bash
# Jos sinulla on ffmpeg:
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf scale=1920:-2 -b:v 2M -movflags +faststart public/videos/boat-dolphins-bg.mp4
```

TAI käytä online-työkaluja:
- https://www.freeconvert.com/video-compressor
- https://www.online-convert.com/

**Tavoitteet:**
- Resoluutio: 1920x1080 tai 1280x720
- Kesto: 10-30 sekuntia (looppaa automaattisesti)
- Tiedostokoko: alle 5-10MB
- Formaatti: MP4 (H.264)

### 3. Lisää projektin

Tallenna video:
```
public/videos/boat-dolphins-bg.mp4
```

### 4. Testaa

Käynnistä dev-palvelin ja mene sivulle:
```bash
npm run dev
```

Avaa: http://localhost:3000/fi/fuengirola-veneretket

Video näkyy hero-sectionin taustalla himmennettyänä (opacity: 20%).

## Tekninen toteutus

Video on lisätty `HeroSection.tsx` komponenttiin:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover opacity-20"
>
  <source src="/videos/boat-dolphins-bg.mp4" type="video/mp4" />
</video>
```

**Ominaisuudet:**
- `autoPlay`: Alkaa automaattisesti
- `loop`: Toistuu loputtomiin
- `muted`: Äänetön (vaaditaan autoplay-toimivuuteen)
- `playsInline`: Toimii mobiilissa
- `opacity-20`: 20% läpinäkyvyys (ei häiritse sisältöä)

## Fallback

Jos videota ei löydy, taustalla näkyy animoitu sininen gradientti placeholder-efektinä.

## Suositellut videot

Kun haet videota, etsi:
- ✅ Delfiinejä uimassa kirkkaassa vedessä
- ✅ Valkoinen vene / jahti
- ✅ Välimerellinen tunnelma
- ✅ Aurinkoinen päivä
- ✅ Ilmakuva (aerial shot) tai veden pinnalta
- ❌ Ei pimeää / yökuvaa
- ❌ Ei liikaa liikettä (rauhallinen kamera)
- ❌ Ei tekstiä / vesileimoja

## Tiedostojen sijainti

```
public/videos/
├── boat-dolphins-bg.mp4          # LISÄÄ TÄMÄ VIDEO
├── boat-dolphins-bg-README.txt   # Ohjeet
├── dolphins.mp4.txt              # Placeholder
├── sunset.mp4.txt                # Placeholder
└── tour.mp4.txt                  # Placeholder
```

