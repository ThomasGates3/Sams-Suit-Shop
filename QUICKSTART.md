# Quick Start Guide

Get Sam's Suit Shop running in minutes.

## Option 1: Docker Compose (Recommended)

### 1. Start Services

```bash
docker-compose up
```

Wait for both services to be ready (backend will initialize the database).

### 2. Seed Sample Data

```bash
docker-compose exec backend npm run seed
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. Run Tests

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

### 5. Stop Services

```bash
docker-compose down
```

---

## Option 2: Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- npm

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Create Backend Environment

```bash
cp .env.example .env
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Start Backend Server

```bash
npm run dev
```

Backend runs on http://localhost:3000

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Start Frontend Development Server

```bash
npm run dev
```

Frontend runs on http://localhost:5173

### 7. Seed Database

In another terminal (from backend directory):

```bash
npm run seed
```

### 8. Run Tests

```bash
# Terminal 1 - Backend tests
cd backend
npm test

# Terminal 2 - Frontend tests
cd frontend
npm test
```

---

## Test Credentials

After seeding, use these credentials to test authentication:

**Admin User:**
- Email: `admin@example.com`
- Password: `AdminPass123`

**Regular Customer:**
- Email: `customer@example.com`
- Password: `CustomerPass123`

---

## API Endpoints to Try

### Health Check
```bash
curl http://localhost:3000/health
```

### List Products
```bash
curl http://localhost:3000/api/products
```

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123"
  }'
```

---

## Project Structure at a Glance

```
sams-suit-shop/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts     # Express app
│   │   ├── services/    # Business logic
│   │   ├── db/          # Database schema & seeding
│   │   └── types/       # TypeScript types
│   └── tests/           # Unit tests
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main component
│   │   └── main.tsx     # Entry point
│   └── tests/           # Component tests
├── docker-compose.yml   # Local dev setup
└── README.md            # Full documentation
```

---

## Next Steps

1. **Explore the code**: Check out `backend/src/services/authService.ts` and `frontend/src/App.tsx`

2. **Add more features**:
   - Product filtering
   - Shopping cart logic
   - Checkout flow
   - Admin dashboard

3. **Write more tests**:
   - Product service tests
   - Order service tests
   - Component tests

4. **Deploy to AWS**:
   - Follow `DEPLOYMENT.md` for step-by-step instructions

---

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Kill process on port 5173
lsof -i :5173
kill -9 <PID>
```

### Database Not Initialized

```bash
# Restart backend service
docker-compose restart backend

# Reseed data
docker-compose exec backend npm run seed
```

### Tests Not Running

```bash
# Make sure dependencies are installed
npm install

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with npx
npx vitest run
```

### Environment Issues

```bash
# Copy environment template
cp .env.example .env

# For frontend, create in frontend directory
cd frontend
cp .env.example .env
```

---

## Need Help?

- See `README.md` for comprehensive documentation
- Check `DEPLOYMENT.md` for production deployment
- Review test files for code examples
- Check git commit history for implementation patterns

Happy coding! 🚀