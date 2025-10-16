import { useState, useEffect } from 'react';
import axios from 'axios';
import { CartProvider, useCart } from './context/CartContext';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';

// Import images
import deepBlueSuit from './images/deep-blue-suit.webp';
import burgundySuit from './images/burgundy-suit.webp';
import lightGraySuit from './images/light-gray-suit.webp';
import whiteweddingSuit from './images/white-wedding-suit.jpg';
import brownTweedSuit from './images/brown-tweed-suit.webp';
import roseGoldSuit from './images/rose-gold-suit.webp';
import oliveGreenSuit from './images/olive-green-suit.webp';
import blackFormalSuit from './images/black-formal-suit.webp';
import charcoalSuit from './images/charcoal-suit.webp';

// Map image paths to product names
const imageMap: Record<string, string> = {
  '/images/deep-blue-suit.webp': deepBlueSuit,
  '/images/burgundy-suit.webp': burgundySuit,
  '/images/light-gray-suit.webp': lightGraySuit,
  '/images/white-wedding-suit.jpg': whiteweddingSuit,
  '/images/brown-tweed-suit.webp': brownTweedSuit,
  '/images/rose-gold-suit.webp': roseGoldSuit,
  '/images/olive-green-suit.webp': oliveGreenSuit,
  '/images/black-formal-suit.webp': blackFormalSuit,
  '/images/charcoal-suit.webp': charcoalSuit,
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  style: string;
  image_url?: string;
}

type Page = 'home' | 'product' | 'cart';

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { items } = useCart();

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'dark bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <header className={`shadow transition-colors ${
        darkMode ? 'dark:bg-slate-800' : 'bg-white'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <button
            onClick={() => setPage('home')}
            className="text-3xl font-bold hover:opacity-80"
          >
            Sam's Suit Shop
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage('cart')}
              className={`relative px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🛒 Cart
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Home Page */}
        {page === 'home' && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Welcome to Sam's Suit Shop</h2>
              <p className={`text-lg mb-8 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Premium suits for every occasion
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading products...</div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer ${
                      darkMode ? 'bg-slate-800' : 'bg-white'
                    }`}
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setPage('product');
                    }}
                  >
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {product.image_url && imageMap[product.image_url] ? (
                        <img
                          src={imageMap[product.image_url]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          👔
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          darkMode
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {product.style}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductId(product.id);
                          setPage('product');
                        }}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                No products available. Start by adding some!
              </div>
            )}
          </>
        )}

        {/* Product Detail Page */}
        {page === 'product' && (
          <ProductDetail
            productId={selectedProductId}
            onBack={() => setPage('home')}
          />
        )}

        {/* Cart Page */}
        {page === 'cart' && (
          <Cart onBack={() => setPage('home')} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;