/**
 * Seed Script for 1 Mukhi Rudraksha Products (3 bead types with size variants)
 *
 * Creates 3 products:
 * - 1 Mukhi (beads type: 1 mukhi beads) – Regular, Medium, Collector, Super Collector
 * - 1 Mukhi Savar (1 mukhi savar) – Regular, Medium, Collector, Super Collector
 * - 1 Mukhi Moon-Shape (1 mukhi moon-shape) – Medium, Collector, Super Collector
 *
 * Prices in INR (≈ $1 = 85 INR): Regular 34000, Medium 42500, Collector 51000,
 * Super Collector 119000; Moon-Shape Medium 212500, Collector 255000, Super Collector 433500.
 *
 * Run with: npx ts-node scripts/seed-1mukhi-rudraksha-products.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProductModel, ProductAvailability } from '../src/models/Product.model';
import { RudrakshaCategoryModel } from '../src/models/RudrakshaCategory.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in environment variables');
  process.exit(1);
}

// Prices in INR (USD * 85)
const PRICE = {
  REGULAR: 34000,       // $400
  MEDIUM: 42500,        // $500
  COLLECTOR: 51000,     // $600
  SUPER_COLLECTOR: 119000, // $1400
  MOON_MEDIUM: 212500,  // $2500
  MOON_COLLECTOR: 255000,  // $3000
  MOON_SUPER: 433500,   // $5100
};

async function seed1MukhiRudrakshaProducts() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    let oneMukhiCategory = await RudrakshaCategoryModel.findOne({ slug: '1-mukhi' });

    if (!oneMukhiCategory) {
      oneMukhiCategory = await RudrakshaCategoryModel.create({
        name: '1 Mukhi Rudraksha',
        slug: '1-mukhi',
        description: 'The rarest and most powerful Rudraksha, representing Lord Shiva in his one-faced form.',
        categoryType: 'mukhi',
        mukhiCount: 1,
        isActive: true,
        displayOrder: 1,
        associatedDeity: 'Lord Shiva',
        spiritualSignificance: 'The 1 Mukhi Rudraksha enhances spiritual growth, inner peace, and removes negative energies. Ideal for mental clarity, focus, and self-realization.',
      });
      console.log('✓ Created 1 Mukhi Rudraksha category');
    } else {
      console.log('✓ Found existing 1 Mukhi Rudraksha category');
    }

    // Remove old per-size products so only the 3 bead-type products remain
    const oldSkus = [
      'RUD-1MUKHI-REG-001', 'RUD-1MUKHI-MED-001', 'RUD-1MUKHI-COL-001', 'RUD-1MUKHI-SUP-001',
      'RUD-1MUKHI-SAV-REG-001', 'RUD-1MUKHI-SAV-MED-001', 'RUD-1MUKHI-SAV-COL-001', 'RUD-1MUKHI-SAV-SUP-001',
      'RUD-1MUKHI-MOON-MED-001', 'RUD-1MUKHI-MOON-COL-001', 'RUD-1MUKHI-MOON-SUP-001',
    ];
    const deleted = await ProductModel.deleteMany({ sku: { $in: oldSkus } });
    if (deleted.deletedCount > 0) {
      console.log(`✓ Removed ${deleted.deletedCount} old per-size products`);
    }

    const products = [
      {
        name: '1 Mukhi',
        type: '1 mukhi beads',
        description: `The 1 Mukhi Rudraksha is the rarest and most powerful Rudraksha, representing Lord Shiva in his one-faced form. Wearing it is believed to enhance spiritual growth, bring inner peace, and remove negative energies from one's life. It is ideal for those seeking mental clarity, focus, and self-realization. This bead is also said to protect from obstacles, boost confidence, and strengthen willpower, making it suitable for both spiritual aspirants and professionals. Traditionally, it is worn after proper prayer and energization, and it can be used during meditation to align the mind with divine consciousness.`,
        beejMantra: 'Om Namah Shivaya',
        rulingDeity: 'Lord Shiva',
        price: PRICE.REGULAR,
        startingPrice: PRICE.REGULAR,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: oneMukhiCategory._id,
        productType: 'BEADS',
        stock: 10,
        availability: ProductAvailability.IN_STOCK,
        sku: 'RUD-1MUKHI-BEADS',
        isActive: true,
        sizes: [
          { name: 'Regular', price: PRICE.REGULAR },
          { name: 'Medium', price: PRICE.MEDIUM },
          { name: 'Collector', price: PRICE.COLLECTOR },
          { name: 'Super Collector', price: PRICE.SUPER_COLLECTOR },
        ],
      },
      {
        name: '1 Mukhi Savar',
        type: '1 mukhi savar',
        description: `The 1 Mukhi Savar Rudraksha is a rare and spiritually significant bead. It is believed to bring supreme clarity of thought, enhance leadership qualities, and strengthen the wearer's determination. This bead helps in removing negative energies, providing protection, and creating harmony in life. It is especially suitable for those who want to advance in personal and professional life while maintaining spiritual balance. Meditating with this Rudraksha can help connect deeply with Lord Shiva's energy, fostering inner calm, emotional stability, and higher consciousness.`,
        beejMantra: 'Om Namah Shivaya',
        rulingDeity: 'Lord Shiva',
        price: PRICE.REGULAR,
        startingPrice: PRICE.REGULAR,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: oneMukhiCategory._id,
        productType: 'BEADS',
        stock: 10,
        availability: ProductAvailability.IN_STOCK,
        sku: 'RUD-1MUKHI-SAVAR',
        isActive: true,
        sizes: [
          { name: 'Regular', price: PRICE.REGULAR },
          { name: 'Medium', price: PRICE.MEDIUM },
          { name: 'Collector', price: PRICE.COLLECTOR },
          { name: 'Super Collector', price: PRICE.SUPER_COLLECTOR },
        ],
      },
      {
        name: '1 Mukhi Moon-Shape',
        type: '1 mukhi moon-shape',
        description: `The 1 Mukhi Moon-Shaped Rudraksha is a rare and exquisite variant, symbolizing the mind, emotions, and spiritual balance. It is said to calm emotional disturbances, enhance intuition, and improve meditation practices. Wearing this bead can help achieve mental clarity, spiritual insight, and emotional stability, making it perfect for those seeking personal transformation and divine guidance. It is also known to remove obstacles and protect from negative influences, allowing the wearer to align with higher consciousness and Lord Shiva's blessings. Regular meditation with this bead is believed to enhance inner peace, wisdom, and spiritual awakening.`,
        beejMantra: 'Om Namah Shivaya',
        rulingDeity: 'Lord Shiva',
        price: PRICE.MOON_MEDIUM,
        startingPrice: PRICE.MOON_MEDIUM,
        images: [],
        category: 'rudraksha',
        rudrakshaCategory: oneMukhiCategory._id,
        productType: 'BEADS',
        stock: 10,
        availability: ProductAvailability.IN_STOCK,
        sku: 'RUD-1MUKHI-MOON',
        isActive: true,
        sizes: [
          { name: 'Medium', price: PRICE.MOON_MEDIUM },
          { name: 'Collector', price: PRICE.MOON_COLLECTOR },
          { name: 'Super Collector', price: PRICE.MOON_SUPER },
        ],
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const productData of products) {
      const existing = await ProductModel.findOne({ sku: productData.sku });

      if (!existing) {
        await ProductModel.create(productData);
        console.log(`✓ Created: ${productData.name} (${productData.type}) – ${productData.sizes!.length} sizes`);
        createdCount++;
      } else {
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
              sizes: productData.sizes,
              category: productData.category,
              rudrakshaCategory: productData.rudrakshaCategory,
              productType: productData.productType,
              stock: productData.stock,
              availability: productData.availability,
              isActive: productData.isActive,
            },
          }
        );
        console.log(`✓ Updated: ${productData.name} (${productData.type}) – ${productData.sizes!.length} sizes`);
        updatedCount++;
      }
    }

    const linked = await ProductModel.find({
      rudrakshaCategory: oneMukhiCategory._id,
      isActive: true,
    });

    console.log(`\n✅ Done. Products in 1 Mukhi category: ${linked.length} (Created: ${createdCount}, Updated: ${updatedCount})`);
    linked.forEach((p) => {
      const sizeInfo = (p as any).sizes?.length ? ` – ${(p as any).sizes.length} sizes` : '';
      console.log(`   - ${(p as any).name} (${(p as any).type}) Rs. ${(p as any).price}${sizeInfo}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding products:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed1MukhiRudrakshaProducts();
