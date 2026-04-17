/**
 * One-off: insert gem inventory products (linked to GemCategory by slug).
 * Run from backend: npx ts-node -r tsconfig-paths/register src/scripts/seed-gem-products.ts
 */
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GemCategoryModel } from '@models/GemCategory.model';
import { ProductModel, ProductAvailability } from '@models/Product.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

type SeedRow = {
  name: string;
  price: number;
  gemCategorySlug: string;
  /** Try these slugs in order if the first GemCategory is missing */
  slugFallbacks?: string[];
  images: string[];
  sku: string;
};

const DESCRIPTION =
  'Natural certified gemstone suitable for Vedic astrology and daily wear. Quality-checked; weight and price as listed. Contact us for certification details.';

const ROWS: SeedRow[] = [
  {
    name: 'Brazilian Emerald - 2.09 Carats',
    price: 9500,
    gemCategorySlug: 'emerald',
    slugFallbacks: ['brazilian-emerald'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798831/Screenshot_2569-04-10_at_11.11.22_alwxlh.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798831/Screenshot_2569-04-10_at_11.11.15_gyg91w.png',
    ],
    sku: 'GEM-EMERALD-BRA-209-95K',
  },
  {
    name: 'Emerald - 4.63 Carats',
    price: 15300,
    gemCategorySlug: 'emerald',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798831/Screenshot_2569-04-10_at_11.11.28_hhsn5r.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798832/Screenshot_2569-04-10_at_11.11.34_bquslv.png',
    ],
    sku: 'GEM-EMERALD-463-153K',
  },
  {
    name: 'African Ruby - 4.48 Carats',
    price: 12000,
    gemCategorySlug: 'ruby',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798834/Screenshot_2569-04-10_at_11.09.54_wi3dmo.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798835/Screenshot_2569-04-10_at_11.10.01_ewhy6e.png',
    ],
    sku: 'GEM-RUBY-AFR-448-12K',
  },
  {
    name: 'Ruby - 6.1 Carats',
    price: 35000,
    gemCategorySlug: 'ruby',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798833/Screenshot_2569-04-10_at_11.09.46_l0ljt7.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798833/Screenshot_2569-04-10_at_11.09.38_uqgycu.png',
    ],
    sku: 'GEM-RUBY-610-35K',
  },
  {
    name: 'African Ruby - 8.81 Carats',
    price: 30500,
    gemCategorySlug: 'ruby',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798837/Screenshot_2569-04-10_at_11.10.08_ocxymk.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798831/Screenshot_2569-04-10_at_11.10.18_hmwqam.png',
    ],
    sku: 'GEM-RUBY-AFR-881-30K5',
  },
  {
    name: 'African Ruby - 4.44 Carats',
    price: 25700,
    gemCategorySlug: 'ruby',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798834/Screenshot_2569-04-10_at_10.48.07_vqczjj.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798835/Screenshot_2569-04-10_at_10.47.56_xb3saq.png',
    ],
    sku: 'GEM-RUBY-AFR-444-25K7',
  },
  {
    name: 'South Sea Pearl - 3.32 Carats',
    price: 7500,
    gemCategorySlug: 'pearl',
    slugFallbacks: ['south-sea-pearl'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798834/Screenshot_2569-04-10_at_11.11.46_qismoq.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798836/Screenshot_2569-04-10_at_11.11.59_lvbcmx.png',
    ],
    sku: 'GEM-PEARL-SSP-332-75K',
  },
  {
    name: 'South Sea Pearl - 7 Carats',
    price: 25000,
    gemCategorySlug: 'pearl',
    slugFallbacks: ['south-sea-pearl'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798835/Screenshot_2569-04-10_at_11.12.05_yko6tk.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798834/Screenshot_2569-04-10_at_11.11.46_qismoq.png',
    ],
    sku: 'GEM-PEARL-SSP-700-25K',
  },
  {
    name: 'Red Coral - 3.72 Carats',
    price: 12000,
    gemCategorySlug: 'red-coral',
    slugFallbacks: ['coral'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798832/Screenshot_2569-04-10_at_11.10.49_siziej.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798833/Screenshot_2569-04-10_at_11.10.53_ih05vg.png',
    ],
    sku: 'GEM-CORAL-RED-372-12K',
  },
  {
    name: 'Red Coral - 3.63 Carats',
    price: 15700,
    gemCategorySlug: 'red-coral',
    slugFallbacks: ['coral'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798837/Screenshot_2569-04-10_at_11.11.07_ctwabc.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775798835/Screenshot_2569-04-10_at_11.11.00_kr6n07.png',
    ],
    sku: 'GEM-CORAL-RED-363-15K7',
  },
  {
    name: 'Yellow Sapphire - 3.9 Carats',
    price: 112000,
    gemCategorySlug: 'yellow-sapphire',
    slugFallbacks: ['sapphire'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808051/Screenshot_2569-04-10_at_13.41.55_py0btr.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808051/Screenshot_2569-04-10_at_13.41.46_zd7yqe.png',
    ],
    sku: 'GEM-SAPPHIRE-YEL-390-112K',
  },
  {
    name: 'Yellow Sapphire - 8.57 Carats',
    price: 36000,
    gemCategorySlug: 'yellow-sapphire',
    slugFallbacks: ['sapphire'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808052/Screenshot_2569-04-10_at_13.42.25_vbxxto.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808052/Screenshot_2569-04-10_at_13.42.04_rs4up4.png',
    ],
    sku: 'GEM-SAPPHIRE-YEL-857-36K',
  },
  {
    name: 'Ceylon Blue Sapphire - 3.64 Carats',
    price: 19000,
    gemCategorySlug: 'blue-sapphire',
    slugFallbacks: ['sapphire'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808054/Screenshot_2569-04-10_at_13.42.57_xbroha.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808052/Screenshot_2569-04-10_at_13.42.49_lwlzlk.png',
    ],
    sku: 'GEM-SAPPHIRE-BLU-CEY-364-19K',
  },
  {
    name: 'Ceylon Blue Sapphire - 4.31 Carats',
    price: 22500,
    gemCategorySlug: 'blue-sapphire',
    slugFallbacks: ['sapphire'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.43.04_tt5xba.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.43.14_kyuwkc.png',
    ],
    sku: 'GEM-SAPPHIRE-BLU-CEY-431-22K5',
  },
  {
    name: 'Blue Sapphire - 3.71 Carats',
    price: 88000,
    gemCategorySlug: 'blue-sapphire',
    slugFallbacks: ['sapphire'],
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.44.20_dinfms.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.43.25_tmvcu3.png',
    ],
    sku: 'GEM-SAPPHIRE-BLU-371-88K',
  },
  {
    name: 'Hessonite - 11 Carats',
    price: 20000,
    gemCategorySlug: 'hessonite',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808052/Screenshot_2569-04-10_at_13.44.46_z94q3y.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.45.04_efqqns.png',
    ],
    sku: 'GEM-HESSONITE-1100-20K',
  },
  {
    name: 'Hessonite - 16.72 Carats',
    price: 24000,
    gemCategorySlug: 'hessonite',
    images: [
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808051/Screenshot_2569-04-10_at_13.45.31_ovgldz.png',
      'https://res.cloudinary.com/dowwwaitp/image/upload/v1775808050/Screenshot_2569-04-10_at_13.45.45_d6m8mh.png',
    ],
    sku: 'GEM-HESSONITE-1672-24K',
  },
];

async function resolveGemCategoryId(
  primary: string,
  fallbacks: string[] | undefined
): Promise<mongoose.Types.ObjectId | null> {
  const slugs = [primary, ...(fallbacks ?? [])];
  for (const s of slugs) {
    const doc = await GemCategoryModel.findOne({ slug: s }).select('_id').lean();
    if (doc?._id) return doc._id as mongoose.Types.ObjectId;
  }
  return null;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of ROWS) {
    const gemCatId = await resolveGemCategoryId(row.gemCategorySlug, row.slugFallbacks);
    if (!gemCatId) {
      console.error(
        `No GemCategory for slugs [${row.gemCategorySlug}${row.slugFallbacks?.length ? ', ' + row.slugFallbacks.join(', ') : ''}] — create category first: ${row.name}`
      );
      skipped++;
      continue;
    }

    const existing = await ProductModel.findOne({ sku: row.sku.toUpperCase() });
    if (existing) {
      await ProductModel.updateOne({ _id: existing._id }, { $set: { images: row.images } });
      console.log(`Updated images: ${row.name} (${row.sku})`);
      updated++;
      continue;
    }

    await ProductModel.create({
      name: row.name,
      description: DESCRIPTION,
      price: row.price,
      images: row.images,
      category: 'gems',
      gemCategory: gemCatId,
      stock: 1,
      availability: ProductAvailability.IN_STOCK,
      sku: row.sku,
      isActive: true,
    });
    console.log(`Created: ${row.name} (${row.sku})`);
    created++;
  }

  console.log(`Done. Created ${created}, updated ${updated}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
