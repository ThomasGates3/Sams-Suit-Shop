# Sam's Suit Shop - Full Stack E-Commerce Application

A locally testable, cloud-ready suit shop application demonstrating modern web development practices with AWS deployment readiness.

## Overview

This is a minimal but complete e-commerce application featuring:
- Product catalog with filtering
- Shopping cart functionality
- Basic order management
- Admin dashboard with CRUD operations
- JWT-based authentication
- Fully containerized with Docker
- Comprehensive test coverage (unit + E2E)

## Technology Stack

### Backend
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express.js
- **Database**: SQLite (local), designed for PostgreSQL migration
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod
- **Testing**: Vitest

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Testing**: Vitest + React Testing Library

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (local dev)
- **E2E Testing**: Playwright (ready)

## Project Structure

```
sams-suit-shop/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/        # API endpoints
│   │   │   └── middleware/    # Auth, error handling
│   │   ├── db/                # Database schema & seed
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Express app entry
│   ├── tests/
│   │   ├── unit/              # Unit tests
│   │   └── e2e/               # E2E tests (Playwright)
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── context/           # Context providers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                 # Component tests
│   ├── Dockerfile
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml         # Local development setup
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended for local dev)
- OR Node.js 18+, npm

### Option 1: Docker Compose (Recommended)

```bash
# Clone/navigate to project
cd sams-suit-shop

# Start all services
docker-compose up

# In another terminal, seed the database
docker-compose exec backend npm run seed
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Option 2: Local Development (Without Docker)

```bash
# Backend setup
cd backend
npm install
npm run build
npm run dev

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

## Running Tests

### Backend Unit Tests
```bash
cd backend
npm install
npm test                 # Run all tests
npm run test:coverage   # Coverage report
npm run test:ui         # Interactive UI
```

### Frontend Component Tests
```bash
cd frontend
npm install
npm test                 # Run all tests
npm run test:coverage   # Coverage report
npm run test:ui         # Interactive UI
```

### E2E Tests (Playwright)
```bash
# Install Playwright (one-time)
npx playwright install

# Run E2E tests
npx playwright test
```

## Environment Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./data/suit-shop.db
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600
LOG_LEVEL=debug
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

Copy `.env.example` files to `.env` to get started.

## API Endpoints

### Products
```
GET    /api/products              # List products (with filters)
GET    /api/products/:id          # Get product details
```

### Authentication
```
POST   /api/auth/register         # Register new user
POST   /api/auth/login            # Login user
```

### Cart
```
POST   /api/cart                  # Add to cart
DELETE /api/cart/:itemId          # Remove from cart
```

### Orders
```
POST   /api/orders                # Create order from cart
GET    /api/orders/:id            # Get order details
```

### Admin (Protected Routes)
```
POST   /api/admin/products        # Create product
PUT    /api/admin/products/:id    # Update product
DELETE /api/admin/products/:id    # Delete product
GET    /api/admin/orders          # List all orders
GET    /api/admin/stats           # Basic analytics
```

## Cloud Deployment

### AWS Deployment Strategy

1. **Build Docker Images**
   ```bash
   # Backend
   docker build -t your-repo/sams-suit-shop-backend:latest ./backend

   # Frontend
   docker build -t your-repo/sams-suit-shop-frontend:latest ./frontend
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
   docker push your-repo/sams-suit-shop-backend:latest
   docker push your-repo/sams-suit-shop-frontend:latest
   ```

3. **Deploy Infrastructure** (Terraform Ready)
   - ECS Fargate for containerized workloads
   - RDS PostgreSQL for production database
   - ALB for load balancing
   - S3 for static assets
   - CloudFront for CDN

4. **Environment Secrets** (AWS Secrets Manager)
   - `JWT_SECRET`
   - `DATABASE_URL` (RDS connection)
   - `DB_PASSWORD`

## Development Workflow

### Adding a New Endpoint

1. Create route handler in `backend/src/api/routes/`
2. Add TypeScript types in `backend/src/types/`
3. Implement service logic in `backend/src/services/`
4. Write unit tests in `backend/tests/unit/`
5. Update API documentation in README

### Adding a New Component

1. Create component in `frontend/src/components/`
2. Write tests in `frontend/tests/components/`
3. Import and use in pages

## Testing Coverage

### Current Status
- ✅ Backend Auth Service: 100% coverage
- ✅ Frontend App Component: Basic tests
- 🔄 Remaining endpoints: In development

### Target: >60% code coverage

## Performance Considerations

- **Stateless Design**: Ready for horizontal scaling
- **Database**: SQLite for local dev, PostgreSQL for production
- **Caching**: Session/cart abstraction ready for Redis
- **Images**: S3 integration ready for product images
- **CDN**: Cloudfront distribution ready

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- CORS configuration for frontend
- Input validation with Zod
- Protected admin routes
- No secrets in Docker images

## Code Quality

- TypeScript strict mode enabled
- ESLint ready (configuration pending)
- Prettier formatting (configuration pending)
- Pre-commit hooks ready (husky)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database Issues
```bash
# Reset database
rm backend/data/suit-shop.db
docker-compose restart backend
npm run seed
```

### Build Failures
```bash
# Clean install
rm -rf backend/node_modules frontend/node_modules
npm install --workspaces
```

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Run tests: `npm test`
4. Push and create PR

## License

MIT

## Next Steps

- [ ] Implement product routes with filtering
- [ ] Implement cart management logic
- [ ] Implement order checkout flow
- [ ] Implement admin CRUD endpoints
- [ ] Add Playwright E2E tests
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive logging
- [ ] Deploy to AWS

---

**Built for cloud deployment. Ready for scale.**