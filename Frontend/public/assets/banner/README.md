Banner image folder structure and guidelines

Structure created for you:

- /public/assets/banner/
  - /banner1/
    - /pc/placeholder.svg    -> desktop (wide) image, recommended ratio 3:1
    - /mobile/placeholder.svg -> mobile (tall) image, recommended ratio 3:4
  - /banner2/ (same as banner1)
  - /banner3/ (same as banner1)

Naming & sizes
-- Desktop (wide): 3:1 (e.g., 3000x1000, 2000x667, 1600x533). Save as `pc` variant named `pc.png` (or `.jpg`/`.webp`).
-- Mobile (tall): 3:4 (e.g., 900x1200, 720x960). Save as `mobile` variant named `mobile.png` (or `.jpg`/`.webp`).

How to use your own images
-- Replace `placeholder.svg` files or the newly added `pc.png` / `mobile.png` files with your own images keeping the same file name and folder.
 - Or update the `slides` array in `Frontend/src/components/Layout/Hero.jsx` to point to your uploaded URLs.

Preview
- Run the dev server and open the homepage. Desktop will load `pc` image when viewport >= 768px, otherwise `mobile`.

If you want, I can add an upload UI in the admin area to swap these images from the dashboard.