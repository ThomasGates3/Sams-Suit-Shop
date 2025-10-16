import { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  style: string;
  image_url?: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        const res = await axios.get('http://localhost:3000/api/products');
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
          <h1 className="text-3xl font-bold">Sam's Suit Shop</h1>
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
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Welcome to Sam's Suit Shop</h2>
          <p className={`text-lg mb-8 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Premium suits for every occasion
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  darkMode ? 'bg-slate-800' : 'bg-white'
                }`}
              >
                <div
                  className={`h-48 flex items-center justify-center text-4xl ${
                    darkMode ? 'bg-slate-700' : 'bg-gray-200'
                  }`}
                >
                  👔
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
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
                    Add to Cart
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
      </main>
    </div>
  );
}

export default App;