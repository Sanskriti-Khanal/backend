# How to Add Google Image URLs to Gem Categories

## Method 1: Using JSON File (Recommended)

1. **Open the file**: `update_gem_images.json`

2. **Replace the placeholder URLs** with your Google image URLs:
   ```json
   {
     "gem_images": {
       "amber": "https://your-google-image-url.com/amber.jpg",
       "apatite": "https://your-google-image-url.com/apatite.jpg",
       ...
     }
   }
   ```

3. **Run the update script**:
   ```bash
   cd backend
   node update_gem_images.js
   ```

## Method 2: Using Bash Script

1. **Open the file**: `update_gem_category_images.sh`

2. **Uncomment and fill in the URLs**:
   ```bash
   update_gem_image "amber" "https://your-google-image-url.com/amber.jpg"
   update_gem_image "apatite" "https://your-google-image-url.com/apatite.jpg"
   ```

3. **Run the script**:
   ```bash
   cd backend
   ./update_gem_category_images.sh
   ```

## Important Notes:

- **Slug Format**: Use lowercase with hyphens (e.g., "lapis-lazuli", "tigers-eye")
- **Image URLs**: Must be publicly accessible Google image URLs
- **Admin Token**: Update the token in the scripts if it expires
- **Backend Server**: Make sure your backend is running on `http://localhost:3000`

## Gem Slugs Reference:

- amber, apatite, aventurine, azurite
- tourmaline, bloodstone, ruby, carnelian
- quartz, howlite, amethyst, aquamarine
- sapphire, emerald, citrine, opal
- hessonite, iolite, jasper, pearl
- lapis-lazuli, moonstone, peridot, coral
- tigers-eye, turquoise, zircon
- red-coral, opal-stone, bi-color-tourmaline
- brazilian-emerald, burmese-ruby, chrome-tourmaline
- colombian-emerald, fire-opal, green-tourmaline
- keshi-pearl, panjshir-emerald, pink-tourmaline
- pitambari-neelam, rubellite, russian-emerald
- south-sea-pearl, star-ruby, swat-emerald
- zambian-emerald, zircon-jarkan, african-ruby
- bangkok-yellow-sapphire, yellow-sapphire, blue-sapphire
- cat-s-eye

## After Adding Images:

The frontend will automatically display the images from URLs. No code changes needed!









