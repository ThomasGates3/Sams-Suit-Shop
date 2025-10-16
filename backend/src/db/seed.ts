import { db, initializeDatabase } from './schema.js';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/authService.js';

initializeDatabase();

const sampleProducts = [
  {
    name: 'Classic Black Formal Suit',
    description: 'Elegant black suit perfect for formal occasions',
    price: 299.99,
    style: 'formal',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    image_url: '/images/deep-blue-suit.webp',
    stock: 15
  },
  {
    name: 'Navy Blue Wedding Suit',
    description: 'Premium wedding suit with perfect tailoring',
    price: 449.99,
    style: 'wedding',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    image_url: '/images/navy-blue-suit.webp',
    stock: 10
  },
  {
    name: 'Charcoal Casual Suit',
    description: 'Comfortable casual suit for everyday wear',
    price: 199.99,
    style: 'casual',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    image_url: '/images/deep-blue-suit.webp',
    stock: 20
  },
  {
    name: 'Burgundy Formal Suit',
    description: 'Deep burgundy suit for special events',
    price: 329.99,
    style: 'formal',
    sizes: JSON.stringify(['S', 'M', 'L']),
    image_url: '/images/burgundy-suit.webp',
    stock: 8
  },
  {
    name: 'Light Gray Casual Suit',
    description: 'Light and airy casual suit perfect for summer',
    price: 189.99,
    style: 'casual',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    image_url: '/images/light-gray-suit.webp',
    stock: 12
  },
  {
    name: 'White Wedding Suit',
    description: 'Pristine white suit for grooms and formal events',
    price: 499.99,
    style: 'wedding',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    image_url: '/images/white-wedding-suit.jpg',
    stock: 6
  },
  {
    name: 'Brown Tweed Casual Suit',
    description: 'Classic tweed suit with rustic charm',
    price: 219.99,
    style: 'casual',
    sizes: JSON.stringify(['S', 'M', 'L']),
    image_url: '/images/brown-tweed-suit.webp',
    stock: 9
  },
  {
    name: 'Deep Blue Formal Suit',
    description: 'Rich navy formal suit for business and events',
    price: 349.99,
    style: 'formal',
    sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    image_url: '/images/deep-blue-suit.webp',
    stock: 16
  },
  {
    name: 'Rose Gold Wedding Suit',
    description: 'Stunning rose gold suit for modern weddings',
    price: 459.99,
    style: 'wedding',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    image_url: '/images/rose-gold-suit.webp',
    stock: 7
  },
  {
    name: 'Olive Green Casual Suit',
    description: 'Trendy olive green suit for a modern look',
    price: 209.99,
    style: 'casual',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    image_url: '/images/olive-green-suit.webp',
    stock: 11
  }
];

try {
  // Clear existing data
  db.exec('DELETE FROM cart_sessions');
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');

  // Seed products
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, price, style, sizes, image_url, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of sampleProducts) {
    insertProduct.run(
      `prod_${uuidv4()}`,
      product.name,
      product.description,
      product.price,
      product.style,
      product.sizes,
      product.image_url,
      product.stock
    );
  }

  // Create test users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, is_admin)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run(
    `user_${uuidv4()}`,
    'admin@example.com',
    AuthService.hashPassword('AdminPass123'),
    1
  );

  insertUser.run(
    `user_${uuidv4()}`,
    'customer@example.com',
    AuthService.hashPassword('CustomerPass123'),
    0
  );

  console.log('✓ Database seeded successfully');
  console.log(`✓ Seeded ${sampleProducts.length} products`);
  console.log('✓ Created test users:');
  console.log('  - admin@example.com (password: AdminPass123)');
  console.log('  - customer@example.com (password: CustomerPass123)');
} catch (error) {
  console.error('Failed to seed database:', error);
  process.exit(1);
}