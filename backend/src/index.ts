import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/schema.js';
import { AuthService } from './services/authService.js';
import { ProductService } from './services/productService.js';
import { authMiddleware, adminOnly, AuthRequest } from './middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/schema.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Seed database if empty
seedDatabaseIfEmpty();

function seedDatabaseIfEmpty() {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

  if (productCount.count > 0) {
    return; // Already seeded
  }

  const sampleProducts = [
    {
      name: 'Classic Black Formal Suit',
      description: 'Elegant black suit perfect for formal occasions',
      price: 299.99,
      style: 'formal',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      image_url: '/images/black-formal-suit.webp',
      stock: 15
    },
    {
      name: 'Navy Blue Wedding Suit',
      description: 'Premium wedding suit with perfect tailoring',
      price: 449.99,
      style: 'wedding',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      image_url: '/images/white-wedding-suit.jpg',
      stock: 10
    },
    {
      name: 'Charcoal Casual Suit',
      description: 'Comfortable casual suit for everyday wear',
      price: 199.99,
      style: 'casual',
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      image_url: '/images/charcoal-suit.webp',
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

  // Create default users if they don't exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
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
  }

  console.log('✓ Database seeded with 10 products');
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ PRODUCT ROUTES ============

// GET all products with filters
app.get('/api/products', (req: Request, res: Response) => {
  const { style, minPrice, maxPrice, search } = req.query;
  const filters = {
    style: style as string | undefined,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    search: search as string | undefined,
  };
  const products = ProductService.getAll(filters);
  res.json({ success: true, data: products });
});

// GET single product
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = ProductService.getById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// POST create product (admin only)
app.post('/api/products', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, style, sizes, image_url, stock } = req.body;

    if (!name || !price || !style || !sizes) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const product = ProductService.create({
      name,
      description,
      price,
      style,
      sizes: typeof sizes === 'string' ? sizes : JSON.stringify(sizes),
      image_url,
      stock: stock || 10,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// PUT update product (admin only)
app.put('/api/products/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  try {
    const product = ProductService.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE product (admin only)
app.delete('/api/products/:id', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
  const deleted = ProductService.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

// ============ AUTH ROUTES ============

// POST register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    if (!AuthService.validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    const validation = AuthService.validatePassword(password);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors.join(', ') });
    }

    // Check if user exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const userId = `user_${uuidv4()}`;
    const passwordHash = AuthService.hashPassword(password);

    db.prepare('INSERT INTO users (id, email, password_hash, is_admin) VALUES (?, ?, ?, ?)').run(
      userId,
      email,
      passwordHash,
      0
    );

    const token = AuthService.generateToken(userId, email, false);
    res.status(201).json({ success: true, data: { userId, email, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !AuthService.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = AuthService.generateToken(user.id, user.email, user.is_admin);
    res.json({ success: true, data: { userId: user.id, email: user.email, isAdmin: user.is_admin, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET current user (requires auth)
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(req.user?.userId) as any;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: { userId: user.id, email: user.email, isAdmin: user.is_admin } });
});

// POST refresh token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const newToken = AuthService.generateToken(decoded.userId, decoded.email, decoded.isAdmin);
    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;