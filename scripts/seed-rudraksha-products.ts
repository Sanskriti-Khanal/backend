/**
 * Seed Script for 0 Mukhi Rudraksha Products
 * 
 * Inserts 3 products: 0 Mukhi Rudraksha with different types
 * Run with: npx ts-node scripts/seed-rudraksha-products.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProductModel, ProductAvailability } from '../src/models/Product.model';
import { RudrakshaCategoryModel } from '../src/models/RudrakshaCategory.model';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in environment variables');
  console.error('   Please set MONGODB_URI in your .env file');
  process.exit(1);
}

async function seedRudrakshaProducts() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Find or create 0 Mukhi Rudraksha Category
    let zeroMukhiCategory = await RudrakshaCategoryModel.findOne({ slug: '0-mukhi' });
    
    if (!zeroMukhiCategory) {
      zeroMukhiCategory = await RudrakshaCategoryModel.create({
        name: '0 Mukhi Rudraksha',
        slug: '0-mukhi',
        description: 'Rare and powerful 0 Mukhi Rudraksha',
        categoryType: 'mukhi',
        mukhiCount: 0,
        isActive: true,
        displayOrder: 0,
        associatedDeity: 'Shiva',
        spiritualSignificance: 'The 0 Mukhi Rudraksha is considered extremely rare and powerful, representing the formless aspect of Lord Shiva.',
      });
      console.log('✓ Created 0 Mukhi Rudraksha category');
    } else {
      console.log('✓ Found existing 0 Mukhi Rudraksha category');
    }

    const products = [
      {
        name: '0 Mukhi Rudraksha Bead',
        type: 'Nirakhar Round – Annapurna',
        description: 'The 0 Mukhi Rudraksha is one of the rarest and most spiritually powerful beads, symbolizing absolute completeness and divine nourishment. In its Annapurna form, this Nirakhar Round Rudraksha is believed to invoke prosperity, abundance, and inner fulfillment. It is especially revered by seekers looking to balance material stability with spiritual growth.\n\nThis bead is traditionally associated with removing scarcity mindset, strengthening gratitude, and aligning the wearer with universal abundance. Due to its rarity and spiritual potency, it is often sought by advanced practitioners, healers, and spiritual leaders.',
        beejMantra: 'ॐ अन्नपूर्णायै नमः (Om Annapurnayai Namah)',
        rulingDeity: 'Annapurna Devi',
        price: 5000,
        startingPrice: 5000,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: zeroMukhiCategory._id,
        productType: 'BEADS',
        stock: 0,
        availability: ProductAvailability.OUT_OF_STOCK,
        sku: 'RUD-0MUKHI-ANN-001',
        isActive: true,
      },
      {
        name: '0 Mukhi Rudraksha Bead',
        type: 'Nirakhar Round – 0 Mukhi',
        description: 'The Nirakhar Round 0 Mukhi Rudraksha represents the formless, infinite state of consciousness — beyond creation and destruction. This bead is considered a symbol of pure awareness, inner silence, and divine unity. It is believed to support deep meditation, mental clarity, and liberation from karmic attachments.\n\nTraditionally worn by ascetics and advanced spiritual seekers, this Rudraksha helps dissolve ego-based limitations and promotes a sense of oneness with the universe. Its energetic frequency is subtle yet powerful, making it suitable for those on a serious spiritual path.',
        beejMantra: 'ॐ नमः शिवाय (Om Namah Shivaya)',
        rulingDeity: 'Lord Shiva (Nirguna / Formless Aspect)',
        price: 5000,
        startingPrice: 5000,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: zeroMukhiCategory._id,
        productType: 'BEADS',
        stock: 0,
        availability: ProductAvailability.OUT_OF_STOCK,
        sku: 'RUD-0MUKHI-RND-001',
        isActive: true,
      },
      {
        name: '0 Mukhi Rudraksha Bead',
        type: 'Nirakhar Naag – 0 Mukhi',
        description: 'The Nirakhar Naag 0 Mukhi Rudraksha is a rare and sacred bead symbolizing protection, transformation, and mastery over primal energies. The Naag (serpent) form represents awakened Kundalini energy and deep spiritual evolution.\n\nThis Rudraksha is believed to shield the wearer from negative influences, strengthen intuition, and accelerate inner transformation. It is often recommended for individuals involved in healing practices, energy work, or intense spiritual disciplines. Due to its rarity and powerful symbolism, it is considered a collector-grade spiritual artifact.',
        beejMantra: 'ॐ नमो भगवते वासुकये (Om Namo Bhagavate Vasukaye)',
        rulingDeity: 'Lord Shiva (Naag / Serpent Aspect)',
        price: 5000,
        startingPrice: 5000,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: zeroMukhiCategory._id,
        productType: 'BEADS',
        stock: 0,
        availability: ProductAvailability.OUT_OF_STOCK,
        sku: 'RUD-0MUKHI-NAG-001',
        isActive: true,
      },
    ];

    // Insert or update products
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const productData of products) {
      const existingProduct = await ProductModel.findOne({ sku: productData.sku });

      if (!existingProduct) {
        const product = await ProductModel.create(productData);
        console.log(`✓ Created product: ${productData.name} - ${productData.type} (SKU: ${productData.sku})`);
        createdCount++;
      } else {
        // Update existing product to ensure it's linked to the category and has latest data
        await ProductModel.updateOne(
          { sku: productData.sku },
          {
            $set: {
              name: productData.name,
              type: productData.type,
              description: productData.description,
              beejMantra: productData.beejMantra,
              rulingDeity: productData.rulingDeity,
              price: productData.price,
              startingPrice: productData.startingPrice,
              category: productData.category,
              rudrakshaCategory: productData.rudrakshaCategory,
              productType: productData.productType,
              stock: productData.stock,
              availability: productData.availability,
              isActive: productData.isActive,
            }
          }
        );
        console.log(`✓ Updated product: ${productData.name} - ${productData.type} (SKU: ${productData.sku})`);
        updatedCount++;
      }
    }

    // Verify products are linked correctly
    const linkedProducts = await ProductModel.find({
      rudrakshaCategory: zeroMukhiCategory._id,
      isActive: true,
    });
    
    console.log(`\n✅ Seeded ${products.length} Rudraksha products`);
    console.log(`   - Created: ${createdCount}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Total products linked to category: ${linkedProducts.length}`);
    console.log('Products are now available in the database');
    
    // List all products for this category
    if (linkedProducts.length > 0) {
      console.log('\n📦 Products linked to 0 Mukhi category:');
      linkedProducts.forEach((p) => {
        console.log(`   - ${p.name} (${p.type}) - SKU: ${p.sku}`);
      });
    } else {
      console.log('\n⚠️  WARNING: No products found linked to the 0 Mukhi category!');
      console.log('   Please check if products were created correctly.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding products:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seed
seedRudrakshaProducts();
