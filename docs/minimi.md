# Modular minimi

Run `npm run editor` and open `/docs/minimi.html` for the interactive wardrobe,
or choose Person in `/editor/` to place the same character in a room.
`node scripts/preview-minimi.js` rebuilds the standalone contact sheet.

The character is drawn in `src/person-minimi.js`. Hair, skin, clothes, limbs,
expressions and accessories share fixed pixel anchors and separate palettes.
The visual direction is a small, early-web miniroom avatar: quiet dot eyes,
swept bangs, soft hair tips and slender limbs. The wardrobe also shows the
character at a small size so its readability can be checked without zooming.
Every outfit works with every hairstyle and all five poses. Sitting lowers the
head and torso by five pixels; the feet remain anchored to the room floor.

`src/catalog-person.js` keeps the existing public API and saved-room properties.
Old `round`, `square`, `stick` and `chibi` shape IDs now render the new minimi.
Unknown hairstyles, outfits and poses resolve to bob, T-shirt and standing.
User-selected skin, hair, top and bottom colors continue to work.

The former generated whole-character sprite files are removed. The standalone
PixelLab generation/import scripts are retained as optional asset utilities;
their output is no longer loaded by the person renderer.

Validation includes all 840 hair/outfit/pose combinations, floor and bubble
anchors, independent recoloring, face preservation while changing clothes,
and editor interactions.
