# Sam's Suit Shop - Simple Architecture Explanation

## What Happens When a User Visits the Website

```
1. User types: http://sams-suit-shop-alb-740113297.us-east-1.elb.amazonaws.com

2. ALB (Application Load Balancer) receives the request
   - Acts like a receptionist
   - Directs traffic to the right place

3. ALB sends request to Frontend (React + Nginx)
   - Frontend shows the web page
   - Lists all 10 products

4. User clicks on a product
   - Frontend asks Backend for product details
   - ALB routes this to Backend

5. Backend responds with product info
   - Frontend displays it

6. User adds product to cart
   - All happens in browser (no server needed)

7. Images load from Frontend or S3+CloudFront
   - If user uploads an image, it goes to S3
   - CloudFront CDN delivers it fast worldwide
```

---

## AWS Services & What They Do

### 1. **ALB (Application Load Balancer)** - The Traffic Director
- **What it does:** Receives all traffic from users
- **How it works:** Looks at URL path and sends to correct service
  - `/` → sends to Frontend (Nginx)
  - `/api/*` → sends to Backend (Node.js)
- **Why we use it:** Balances traffic across multiple running tasks
- **Connected to:** Frontend & Backend services

---

### 2. **ECS (Elastic Container Service)** - Container Runner
- **What it does:** Runs Docker containers in the cloud
- **How it works:**
  - We give it a Docker image
  - ECS launches it as a "task" (running container)
  - Keeps 2 tasks running at all times
- **What runs:**
  - 2 Frontend tasks (Nginx serving React)
  - 2 Backend tasks (Node.js Express server)
- **Connected to:** ECR (gets Docker images), VPC (networking), CloudWatch (logs)

---

### 3. **ECR (Elastic Container Registry)** - Docker Image Storage
- **What it does:** Stores Docker images (like a library for containers)
- **How it works:**
  1. We build a Docker image locally
  2. Push it to ECR (like uploading a file)
  3. ECS pulls the image from ECR to run it
- **What's stored:**
  - `sams-suit-shop-backend:latest` (Node.js + Express)
  - `sams-suit-shop-frontend:latest` (Nginx + React)
- **Connected to:** ECS pulls images from here

---

### 4. **VPC (Virtual Private Cloud)** - Private Network
- **What it does:** Creates a private network in AWS for our services
- **How it works:**
  - Like a private network for our company
  - Two types of subnets:
    - **Public Subnets:** Receives traffic from internet (ALB sits here)
    - **Private Subnets:** Hidden from internet (ECS tasks run here)
- **Why this matters:**
  - Frontend and Backend are hidden
  - Only accessible through ALB
  - More secure
- **Connected to:** Contains everything - ALB, ECS tasks, databases

---

### 5. **S3 (Simple Storage Service)** - File Storage
- **What it does:** Stores files (images, documents, etc.)
- **How it works:**
  - Like a giant hard drive in the cloud
  - Files are organized in a "bucket"
  - Each file has a URL
- **What we store:**
  - Product images uploaded by admins
  - Bucket name: `sams-suit-shop-images-049475639513`
- **Security:** Public access blocked - only CloudFront can access it
- **Connected to:** CloudFront (delivers the images), Backend (uploads images)

---

### 6. **CloudFront** - CDN (Content Delivery Network)
- **What it does:** Delivers files fast worldwide
- **How it works:**
  1. User requests an image
  2. CloudFront checks if it has a copy
  3. If yes → serves from nearest location (fast!)
  4. If no → gets it from S3, caches it
- **Benefits:**
  - Images load 10x faster
  - Less load on S3
  - Cheaper data transfer
- **Connected to:** S3 (gets files from here), Frontend (serves images)

---

### 7. **CloudWatch Logs** - Application Logging
- **What it does:** Collects all log messages from containers
- **How it works:**
  - Every log message from Frontend/Backend gets sent here
  - We can search and debug problems
  - Example logs: "Backend started", "Product fetched", errors
- **Retention:** Keeps logs for 7 days
- **Connected to:** ECS tasks (sends logs here)

---

### 8. **IAM (Identity & Access Management)** - Security & Permissions
- **What it does:** Controls who can do what
- **How it works:**
  - Gives Backend permission to upload files to S3
  - Gives ECS permission to pull images from ECR
  - Gives ECS permission to write logs to CloudWatch
- **Why it matters:** Least-privilege security (each service only gets permissions it needs)
- **Connected to:** ECS, S3, ECR, CloudWatch

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                   │
│  Visits: http://sams-suit-shop-alb.../                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    HTTP Request (Port 80)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ALB (Receptionist)                            │
│                 Looks at request path:                           │
│                                                                   │
│  If "/" or "/assets/*"  ──► Send to Frontend (Nginx)            │
│  If "/api/*"             ──► Send to Backend (Express)          │
└──────────────────────────────┬──────────────────────────────────┘
                 │                          │
                 │                          │
        ┌────────▼────────┐       ┌────────▼────────┐
        │  FRONTEND TASK  │       │  BACKEND TASK   │
        │  (2 running)    │       │  (2 running)    │
        │                 │       │                 │
        │  nginx          │       │  Node.js        │
        │  React          │       │  Express        │
        │  Port: 80       │       │  Port: 3000     │
        └────────┬────────┘       └────────┬────────┘
                 │                         │
         ┌───────┴─────────┬───────────────┤
         │                 │               │
         │        ┌────────▼────────┐     │
         │        │   Backend       │     │
         │        │   API Logic     │     │
         │        │                 │     │
         │        │  /api/products  │     │
         │        │  /api/upload    │     │
         │        └────────┬────────┘     │
         │                 │              │
         │          ┌──────▼──────┐       │
         │          │      S3     │       │
         │          │             │       │
         │          │  Images     │       │
         │          │  Versioning │       │
         │          │  Encryption │       │
         │          └──────┬──────┘       │
         │                 │              │
         │          ┌──────▼──────┐       │
         │          │ CloudFront  │       │
         │          │    CDN      │       │
         │          │             │       │
         │          │  Cache      │       │
         │          │  Compress   │       │
         │          │  Deliver    │       │
         │          └──────┬──────┘       │
         │                 │              │
         │        ┌────────▼────────┐    │
         │        │  User's Browser │    │
         │        │  Displays Page  │    │
         │        └─────────────────┘    │
         │                                │
         └───────────────────────────────┘
         CloudWatch captures all logs
```

---

## Simple Flow Examples

### Example 1: User Sees Product List
```
1. User opens website
2. ALB → Frontend (shows HTML page)
3. Frontend JavaScript runs: axios.get('/api/products')
4. ALB → Backend (/api/products request)
5. Backend queries database
6. Backend → ALB → Frontend (JSON with 10 products)
7. Frontend renders products with images from S3/CloudFront
8. User sees product grid
```

### Example 2: User Clicks on Product Detail
```
1. User clicks "Navy Blue Wedding Suit"
2. Frontend JavaScript runs: axios.get('/api/products/{id}')
3. ALB → Backend
4. Backend returns product details (name, price, size, etc.)
5. Frontend displays product page
6. Image loads from S3 → CloudFront → Browser
7. User can add to cart
```

### Example 3: Admin Uploads Product Image
```
1. Admin clicks upload button
2. Frontend sends: POST /api/upload (with image file)
3. ALB → Backend
4. Backend receives image
5. Backend uploads to S3 bucket
6. Backend tells CloudFront to cache it
7. Image is now available worldwide via CloudFront
```

---

## Connection Map (Simplified)

```
Users
  │
  └─► ALB (listens on port 80)
        │
        ├─► Frontend Tasks (2x) ─► ECS ─► ECR (image)
        │       │                                │
        │       └─► CloudWatch Logs ◄─ IAM Permissions
        │
        └─► Backend Tasks (2x) ─► ECS ─► ECR (image)
                │                           │
                ├─► CloudWatch Logs ◄────────┤
                │
                └─► S3 Bucket ◄─ IAM Permissions
                      │
                      └─► CloudFront ◄─ IAM Permissions
```

---

## What Each AWS Service Does (One-Line Summary)

| Service | Job |
|---------|-----|
| **ALB** | Routes traffic to the right service |
| **ECS** | Runs Docker containers |
| **ECR** | Stores Docker images |
| **VPC** | Private network for services |
| **S3** | Stores files (images) |
| **CloudFront** | Delivers files fast worldwide |
| **CloudWatch** | Collects logs |
| **IAM** | Manages permissions |

---

## Why We Use These Services

**ALB:** So we don't have to manage a server
**ECS:** So containers auto-restart if they fail
**ECR:** So we have a central place for Docker images
**VPC:** So Backend is hidden from internet (security)
**S3:** So we have reliable storage
**CloudFront:** So images load fast everywhere
**CloudWatch:** So we can debug when things break
**IAM:** So services only have access they need (security)

---

## The Big Picture

Think of it like a restaurant:
- **ALB** = Host (directs you to right table)
- **ECS** = Waiters (run around, restart if needed)
- **Backend** = Kitchen (prepares food/data)
- **Frontend** = Dining room (where you eat/interact)
- **S3** = Pantry (stores ingredients/images)
- **CloudFront** = Delivery service (delivers takeout fast)
- **CloudWatch** = Manager (watches everything, logs problems)
- **IAM** = Security guard (controls who accesses what)