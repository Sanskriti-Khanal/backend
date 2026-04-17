const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Prefer env token. Fallback kept for backward compatibility.
const TOKEN =
  process.env.ADMIN_TOKEN ||
  'REPLACE_WITH_FRESH_ADMIN_TOKEN';

const BASE_URL =
  process.env.GEM_API_BASE_URL ||
  'http://localhost:5050/api/v1/gem-categories';
const JSON_FILE = path.join(__dirname, 'update_gem_images.json');

async function updateGemImage(slug, imageUrl) {
  if (!imageUrl || imageUrl === 'YOUR_GOOGLE_IMAGE_URL_HERE') {
    console.log(`  ⏭️  Skipping ${slug} (no URL provided)`);
    return;
  }

  try {
    // Get category by slug
    const getResponse = await axios.get(`${BASE_URL}/slug/${slug}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    const categoryId = getResponse.data.data?._id || getResponse.data._id;
    
    if (!categoryId) {
      console.log(`  ⚠️  Category not found: ${slug}`);
      return;
    }

    // Update category with image URL
    await axios.put(
      `${BASE_URL}/${categoryId}`,
      { image: imageUrl },
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`  ✓ Updated ${slug}`);
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.log(`  ✗ Failed to update ${slug}`);
    if (status) console.log(`    status: ${status}`);
    if (body) {
      try {
        console.log(`    response: ${JSON.stringify(body)}`);
      } catch (_) {
        console.log('    response: [unserializable]');
      }
    } else {
      console.log(`    error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('Updating Gem Category Images from JSON file...\n');
  if (!process.env.ADMIN_TOKEN) {
    console.log('⚠️  ADMIN_TOKEN env var not set. If updates fail with 401, set a fresh admin token.');
  }

  if (!fs.existsSync(JSON_FILE)) {
    console.error(`Error: ${JSON_FILE} not found!`);
    process.exit(1);
  }

  const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const gemImages = jsonData.gem_images;

  if (!gemImages) {
    console.error('Error: "gem_images" key not found in JSON file!');
    process.exit(1);
  }

  const entries = Object.entries(gemImages);
  console.log(`Found ${entries.length} gem image entries\n`);

  for (const [slug, imageUrl] of entries) {
    await updateGemImage(slug, imageUrl);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✅ Done updating gem category images!');
}

main().catch(console.error);









