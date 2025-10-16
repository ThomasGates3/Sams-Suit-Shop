function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Sam's Suit Shop</h1>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Sam's Suit Shop</h2>
          <p className="text-gray-600 mb-8">Premium suits for every occasion</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Formal Suits</h3>
              <p className="text-gray-600">Perfect for weddings and special events</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Casual Suits</h3>
              <p className="text-gray-600">Everyday elegance for work and leisure</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Wedding Suits</h3>
              <p className="text-gray-600">Make your special day unforgettable</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;