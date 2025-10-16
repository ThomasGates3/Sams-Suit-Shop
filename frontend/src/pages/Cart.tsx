import { useCart } from '../context/CartContext';

interface CartProps {
  onBack: () => void;
}

export function Cart({ onBack }: CartProps) {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          ← Back
        </button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some suits to get started!</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-gray-600">Size: {item.size}</p>
              <p className="text-gray-600">${item.price.toFixed(2)} each</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                  className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                  className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => removeItem(item.productId, item.size)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Total:</h2>
          <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold"
          >
            Continue Shopping
          </button>
          <button className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}