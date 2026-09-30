# ZHUDDLE production artwork

These are optimized copies of the supplied illustration and animation pack. The SVG wrappers preserve the original motion and embed WebP-encoded artwork. All 18 main illustrations are used across learning, navigation, hints, challenges, achievements, profile, loading, and celebration states. The snake/flag/landscape layers are also included independently; the challenge scene already composes them.

Use `-still.svg` when motion is disabled. Parent-page CSS cannot stop animations inside an SVG loaded as an image. `src/components/MotionArt.jsx` selects the correct file, handles visibility, and limits event playback.

The original PNG masters and source-pack README are kept in the supplied asset directory outside the website checkout. Rebuild these production copies with `python scripts/optimize-assets.py PATH_TO_GENERATED_ASSETS` (Pillow required). No optimization tools are required for `pnpm build`.
