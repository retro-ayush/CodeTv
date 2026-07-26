# Poster frames

Optional still images shown before each video loads. Same basename as the
clip, `.jpg` extension:

```
panel-01-swing.jpg
panel-02-mask.jpg
panel-03-city.jpg
panel-04-leap.jpg
panel-05-glitch.jpg
panel-06-web.jpg
```

Extract a frame from each clip:

```
ffmpeg -i ../videos/panel-01-swing.mp4 -vf "select=eq(n\,30)" -vframes 1 \
  -q:v 4 panel-01-swing.jpg
```

Entirely optional — a missing poster just means the panel shows its animated
comic fill until the video's first frame decodes.
