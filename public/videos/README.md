# Video clips

Drop your six clips here using **these exact filenames**. Each one is picked up
automatically — no code change needed.

| # | Filename                 | Suggested content            | Frame ratio |
|---|--------------------------|------------------------------|-------------|
| 1 | `panel-01-swing.mp4`     | Swinging / sweeping movement | 16:9        |
| 2 | `panel-02-mask.mp4`      | Close-up, face or object     | 3:4 (tall)  |
| 3 | `panel-03-city.mp4`      | Skyline, city at night       | 16:10       |
| 4 | `panel-04-leap.mp4`      | Falling / jumping motion     | 16:10       |
| 5 | `panel-05-glitch.mp4`    | Abstract, distortion, static | 3:4 (tall)  |
| 6 | `panel-06-web.mp4`       | Fast radial or burst motion  | 16:9        |

Until a file exists, its panel renders as an animated comic frame (duotone
wash, halftone, web lines, scanlines) — the page is complete without them.

## Encoding

Clips are muted, looping, and heavily filtered, so quality can stay modest:

```
ffmpeg -i input.mov -an -vf "scale=1280:-2" -c:v libx264 -crf 26 \
  -movflags +faststart -t 8 panel-01-swing.mp4
```

- **`-an`** strips audio (the videos are muted anyway — saves weight)
- **`-t 8`** trims to 8s; short loops read better than long ones
- **`-movflags +faststart`** lets playback begin before the full file arrives
- Aim for **under 2 MB each** — six panels load on one page

The CSS applies `grayscale(1) contrast(1.35)` and a duotone blend, so colour
grading in the source is wasted effort. Pick clips with strong *motion* and
strong *contrast* rather than the right colours.

## Where to find footage

Free and licensed for reuse: [Pexels Videos](https://www.pexels.com/videos/),
[Pixabay](https://pixabay.com/videos/), [Coverr](https://coverr.co/),
[Mixkit](https://mixkit.co/free-stock-video/).

Abstract stock (ink in water, neon signs, traffic at night, film leader) works
well here — the comic treatment is what creates the aesthetic, not the source.

Note that actual Spider-Man footage is copyrighted; fine for a local
experiment, but don't ship it on a public deploy.

## Changing the panels

Panel definitions live in one array at the top of
`src/components/Collage/Collage.astro`. Edit that array to rename files, change
the duotone (`tone`), resize (`size`), or adjust parallax (`drift`) and
rotation (`tilt`).
