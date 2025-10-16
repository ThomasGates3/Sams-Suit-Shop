import { db } from '../db/schema.js';
import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  style: string;
  sizes: string;
  image_url?: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export class ProductService {
  static getAll(filters?: { style?: string; minPrice?: number; maxPrice?: number; search?: string }): Product[] {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (filters?.style) {
      query += ' AND style = ?';
      params.push(filters.style);
    }

    if (filters?.minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(filters.maxPrice);
    }

    if (filters?.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as Product[];
  }

  static getById(id: string): Product | null {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    return (stmt.get(id) as Product) || null;
  }

  static create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const id = `prod_${uuidv4()}`;
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO products (id, name, description, price, style, sizes, image_url, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.name, data.description, data.price, data.style, data.sizes, data.image_url, data.stock, now, now);
    return this.getById(id)!;
  }

  static update(id: string, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Product | null {
    const product = this.getById(id);
    if (!product) return null;

    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .map(([key]) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), now, id];

    const stmt = db.prepare(`
      UPDATE products SET ${updates}, updated_at = ? WHERE id = ?
    `);
    stmt.run(...values);

    return this.getById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes as number) > 0;
  }
}
