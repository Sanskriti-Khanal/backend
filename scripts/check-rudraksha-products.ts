/**
 * Diagnostic Script to Check 0 Mukhi Rudraksha Products
 * 
 * Checks if products exist and are properly linked to the category
 * Run with: npx ts-node scripts/check-rudraksha-products.ts
 */

import mongoose from 'mongoose';
import { ProductModel } from '../src/models/Product.model';
import { RudrakshaCategoryModel } from '../src/models/RudrakshaCategory.model';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/merosathi';

async function checkRudrakshaProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check category
    const category = await RudrakshaCategoryModel.findOne({ slug: '0-mukhi' });
    if (!category) {
      console.log('❌ ERROR: 0 Mukhi Rudraksha category not found!');
      console.log('   Run the seed script first to create the category.');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✓ Found category:', category.name);
    console.log('   ID:', category._id.toString());
    console.log('   Slug:', category.slug);
    console.log('   Active:', category.isActive);
    console.log('');

    // Check all products with the SKUs
    const skus = ['RUD-0MUKHI-ANN-001', 'RUD-0MUKHI-RND-001', 'RUD-0MUKHI-NAG-001'];
    console.log('Checking products by SKU:');
    for (const sku of skus) {
      const product = await ProductModel.findOne({ sku });
      if (product) {
        console.log(`✓ Found product: ${product.name} (SKU: ${sku})`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Product Type: ${product.productType}`);
        console.log(`   Rudraksha Category ID: ${product.rudrakshaCategory}`);
        console.log(`   Is Active: ${product.isActive}`);
        console.log(`   Availability: ${product.availability}`);
        console.log(`   Linked to 0 Mukhi: ${product.rudrakshaCategory?.toString() === category._id.toString() ? 'YES ✓' : 'NO ✗'}`);
        console.log('');
      } else {
        console.log(`✗ Product not found: ${sku}`);
        console.log('');
      }
    }

    // Check products linked to category
    console.log('Checking products linked to 0 Mukhi category:');
    const linkedProducts = await ProductModel.find({
      rudrakshaCategory: category._id,
      isActive: true,
    });
    
    console.log(`Found ${linkedProducts.length} products linked to category`);
    if (linkedProducts.length === 0) {
      console.log('\n⚠️  WARNING: No products found!');
      console.log('   Possible issues:');
      console.log('   1. Products exist but rudrakshaCategory field is not set');
      console.log('   2. Products exist but isActive is false');
      console.log('   3. Products were not created');
    } else {
      console.log('\nProducts:');
      linkedProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} - ${p.type}`);
        console.log(`      SKU: ${p.sku}`);
        console.log(`      Active: ${p.isActive}`);
        console.log(`      Availability: ${p.availability}`);
      });
    }

    // Check products by category string
    console.log('\nChecking products with category="rudraksha":');
    const rudrakshaProducts = await ProductModel.find({
      category: 'rudraksha',
      isActive: true,
    });
    console.log(`Found ${rudrakshaProducts.length} products with category="rudraksha"`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error checking products:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run check
checkRudrakshaProducts();
