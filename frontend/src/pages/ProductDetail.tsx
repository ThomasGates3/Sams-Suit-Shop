import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  style: string;
  sizes: string;
  image_url?: string;
}

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/products/${productId}`);
        setProduct(res.data.data);
        const sizes = JSON.parse(res.data.data.sizes);
        setSelectedSize(sizes[0] || 'M');
      } catch (err) {
        console.error('Failed to fetch product:', err);
      }
    };
    fetchProduct();
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  const sizes = JSON.parse(product.sizes);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize,
    });
    alert('Added to cart!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-6xl rounded-lg">
              👔
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {product.style.charAt(0).toUpperCase() + product.style.slice(1)}
            </span>
          </div>

          <div className="text-3xl font-bold text-green-600 mb-6">${product.price.toFixed(2)}</div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Size</label>
            <div className="flex gap-2">
              {sizes.map((size: string) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded ${
                    selectedSize === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-800 border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                -
              </button>
              <span className="text-xl font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}