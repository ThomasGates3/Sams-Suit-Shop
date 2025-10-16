# Sam's Suit Shop - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / USERS                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                        HTTP/HTTPS (Port 80/443)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AWS AVAILABILITY ZONES (us-east-1)                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    APPLICATION LOAD BALANCER (ALB)                  │  │
│  │         sams-suit-shop-alb-740113297.us-east-1.elb.amazonaws.com   │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────────┬──────────────────────────────────┐ │  │
│  │  │  Port 80 HTTP Listener      │  Routes requests by path        │ │  │
│  │  │                             │                                  │ │  │
│  │  │  ┌────────────────────────┐ │  ┌──────────────────────────┐   │ │  │
│  │  │  │ /                      │ │  │ Frontend Target Group    │   │ │  │
│  │  │  │ /api/*  ──────────────►│ │  │ (Port 80)                │   │ │  │
│  │  │  └────────────────────────┘ │  │                          │   │ │  │
│  │  │                             │  └──────────────────────────┘   │ │  │
│  │  │                             │                                  │ │  │
│  │  │  ┌────────────────────────┐ │  ┌──────────────────────────┐   │ │  │
│  │  │  │ /*                     │ │  │ Backend Target Group     │   │ │  │
│  │  │  │ (default)  ──────────►│ │  │ (Port 3000)              │   │ │  │
│  │  │  └────────────────────────┘ │  │                          │   │ │  │
│  │  │                             │  └──────────────────────────┘   │ │  │
│  │  └─────────────────────────────┴──────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                 ┌───────────────────┴───────────────────┐                   │
│                 │                                       │                   │
│                 ▼                                       ▼                   │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐   │
│  │   FRONTEND TARGET GROUP      │      │   BACKEND TARGET GROUP       │   │
│  │   (Port 80, Path: /)         │      │   (Port 3000, Path: /api/*) │   │
│  │                              │      │                              │   │
│  │  Health Check:               │      │  Health Check:               │   │
│  │  GET /                       │      │  GET /health                 │   │
│  │  200 OK expected             │      │  200 OK expected             │   │
│  │                              │      │                              │   │
│  │  Target: 2 tasks desired     │      │  Target: 2 tasks desired     │   │
│  │  Status: 2 running ✓         │      │  Status: 2 running ✓         │   │
│  └──────────────────────────────┘      └──────────────────────────────┘   │
│                 │                                       │                   │
│                 ▼                                       ▼                   │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐   │
│  │   ECS SERVICE                │      │   ECS SERVICE                │   │
│  │   sams-suit-shop-frontend    │      │   sams-suit-shop-backend     │   │
│  │                              │      │                              │   │
│  │  Launch Type: FARGATE        │      │  Launch Type: FARGATE        │   │
│  │  CPU: 256 units              │      │  CPU: 256 units              │   │
│  │  Memory: 512 MB              │      │  Memory: 512 MB              │   │
│  │                              │      │                              │   │
│  │  Network: awsvpc             │      │  Network: awsvpc             │   │
│  │  Subnets: private-1, -2      │      │  Subnets: private-1, -2      │   │
│  └──────────────────────────────┘      └──────────────────────────────┘   │
│                 │                                       │                   │
│     ┌───────────┴──────────────┐         ┌──────────────┴───────────────┐  │
│     │                          │         │                              │  │
│     ▼                          ▼         ▼                              ▼  │
│  ┌──────────┐         ┌──────────┐   ┌──────────┐         ┌──────────┐    │
│  │  TASK 1  │         │  TASK 2  │   │  TASK 1  │         │  TASK 2  │    │
│  │(frontend)│         │(frontend)│   │(backend) │         │(backend) │    │
│  │          │         │          │   │          │         │          │    │
│  │ nginx    │         │ nginx    │   │ Node.js  │         │ Node.js  │    │
│  │ React    │         │ React    │   │ Express  │         │ Express  │    │
│  │ Port:80  │         │ Port:80  │   │ Port:3000│         │ Port:3000│    │
│  └──────────┘         └──────────┘   └──────────┘         └──────────┘    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        ECS CLUSTER                                   │  │
│  │                    sams-suit-shop                                    │  │
│  │                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │              VPC: 10.0.0.0/16                               │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌────────────────────────────────────────────────────┐   │  │  │
│  │  │  │  PUBLIC SUBNETS (10.0.1.0/24, 10.0.2.0/24)        │   │  │  │
│  │  │  │  - ALB endpoints                                  │   │  │  │
│  │  │  │  - NAT Gateway (outbound)                         │   │  │  │
│  │  │  └────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌────────────────────────────────────────────────────┐   │  │  │
│  │  │  │  PRIVATE SUBNETS (10.0.10.0/24, 10.0.11.0/24)     │   │  │  │
│  │  │  │  - ECS Tasks (Frontend & Backend)                 │   │  │  │
│  │  │  │  - Egress via NAT Gateway                         │   │  │  │
│  │  │  └────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                             │  │  │
│  │  │  ┌────────────────────────────────────────────────────┐   │  │  │
│  │  │  │  SECURITY GROUPS                                  │   │  │  │
│  │  │  │  - ALB SG: 80, 443 ingress from 0.0.0.0/0        │   │  │  │
│  │  │  │  - ECS SG: all TCP from ALB SG                    │   │  │  │
│  │  │  └────────────────────────────────────────────────────┘   │  │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  CLOUDWATCH LOGS                                        │  │  │
│  │  │  /ecs/sams-suit-shop                                    │  │  │
│  │  │  - frontend/frontend/{task-id}                          │  │  │
│  │  │  - backend/backend/{task-id}                            │  │  │
│  │  │  - Retention: 7 days                                    │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────────┐ ┌────────────────┐ ┌──────────────┐
         │   ECR            │ │   S3           │ │  CloudFront  │
         │                  │ │                │ │              │
         │ - Backend image  │ │ sams-suit-shop-│ │ d3on56fzg4so2d│
         │ - Frontend image │ │ images-        │ │ .cloudfront   │
         │                  │ │ 049475639513   │ │ .net          │
         │ Scan on push: ✓  │ │                │ │              │
         │ Tag mutability   │ │ Versioning: ✓  │ │ TTL: 1 year  │
         │                  │ │ Lifecycle: ✓   │ │              │
         │ Account ID:      │ │                │ │ OAI: ✓        │
         │ 049475639513     │ │ Encryption: ✓  │ │              │
         │                  │ │                │ │ Security     │
         │ Region: us-east-1│ │ Public access: │ │ headers: ✓   │
         │                  │ │ blocked        │ │              │
         └──────────────────┘ └────────────────┘ └──────────────┘
```

## Data Flow

### Frontend (User Interaction)
```
User Browser
    │
    │ HTTP Request (GET / or API calls)
    │
    ▼
ALB (Port 80)
    │
    ├─ /           ─────────► Frontend TG ─► nginx (React App)
    │
    └─ /api/*      ─────────► Backend TG  ─► Node.js Express
```

### Frontend Application Flow
```
React App (Browser)
    │
    ├─ GET /api/products  ─────► Backend API
    │
    ├─ GET /api/products/{id} ─► Backend API (Product Details)
    │
    └─ nginx.conf
        │
        └─ Proxy /api/* to ALB:80 (loopback through ALB)
```

### Backend API Architecture
```
Express Server (Port 3000)
    │
    ├─ GET  /api/products        ─► Database Query
    ├─ GET  /api/products/{id}   ─► Database Query
    ├─ POST /api/upload          ─► S3 + CloudFront Invalidation
    ├─ POST /api/authenticate    ─► JWT Generation
    │
    └─ Environment Variables:
        ├─ AWS_REGION: us-east-1
        ├─ S3_BUCKET_NAME: sams-suit-shop-images-049475639513
        ├─ CLOUDFRONT_DISTRIBUTION_ID: E3MH39NO97LDX9
        └─ CLOUDFRONT_DOMAIN_NAME: d3on56fzg4so2d.cloudfront.net
```

## Storage & CDN Architecture

```
S3 Bucket (sams-suit-shop-images-049475639513)
    │
    ├─ Versioning: Enabled
    ├─ Encryption: AES-256
    ├─ Public Access: Blocked
    │
    └─ Lifecycle Rules:
        ├─ Move to IA after 30 days
        ├─ Move to Glacier after 90 days
        └─ Expire after 365 days

    │
    │ (Object Access)
    │
    ▼
CloudFront Distribution (E3MH39NO97LDX9)
    │
    ├─ Domain: d3on56fzg4so2d.cloudfront.net
    │
    ├─ Cache Policy:
    │  ├─ TTL: 1 year for immutable assets
    │  ├─ Compression: Enabled (gzip, brotli)
    │  └─ Query Strings: Ignored
    │
    ├─ Security Headers:
    │  ├─ HSTS: max-age=31536000
    │  ├─ X-Frame-Options: DENY
    │  ├─ X-Content-Type-Options: nosniff
    │  ├─ X-XSS-Protection: 1; mode=block
    │  └─ Referrer-Policy: strict-origin-when-cross-origin
    │
    └─ Origin Access Identity (OAI)
        └─ Restricts direct S3 access (CloudFront only)
```

## IAM & Security Architecture

```
IAM Roles & Policies
│
├─ ECS Task Execution Role
│  └─ AmazonECSTaskExecutionRolePolicy
│     ├─ ECR GetAuthorizationToken
│     ├─ ECR BatchGetImage
│     ├─ ECR GetDownloadUrlForLayer
│     └─ CloudWatch Logs CreateLogStream & PutLogEvents
│
├─ ECS Task Role
│  └─ S3 Upload Policy
│     ├─ s3:PutObject (sams-suit-shop-images)
│     ├─ s3:GetObject
│     ├─ s3:DeleteObject
│     ├─ s3:ListBucket
│     └─ cloudfront:CreateInvalidation
│
└─ Lambda Execution Role (optional)
   └─ For future automation tasks
```

## Networking Architecture

```
Internet Gateway ◄─────────► Public Subnets
    │                             │
    │                    ┌────────┤────────┐
    │                    │                 │
    ▼                    ▼                 ▼
NAT Gateway          ALB                 Bastion
(Outbound)        (Public facing)      (optional)
    │                    │
    │                    │
    └────────┬───────────┘
             │
             ▼
    Private Subnets (ECS Tasks)
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
Private SG 1    Private SG 2
(AZ1)           (AZ2)
    │                 │
    ├─ Frontend       ├─ Frontend
    ├─ Backend        ├─ Backend
    └─ Task logs      └─ Task logs
```

## CI/CD & Deployment Pipeline

```
Local Development
    │
    ├─ Make code changes
    ├─ git add & commit
    │
    ▼
GitHub Repository
    │
    ├─ (Optionally: GitHub Actions for automated tests)
    │
    ▼
Manual Deployment
    │
    ├─ docker buildx build --platform linux/amd64
    │
    ├─ Push to ECR
    │  ├─ 049475639513.dkr.ecr.us-east-1.amazonaws.com/sams-suit-shop-backend:latest
    │  └─ 049475639513.dkr.ecr.us-east-1.amazonaws.com/sams-suit-shop-frontend:latest
    │
    ▼
ECS Service Update
    │
    ├─ Pull new image from ECR
    ├─ Create new task definition revision
    ├─ Launch new tasks with new image
    ├─ Drain connections from old tasks
    └─ Terminate old tasks
```

## Scaling Architecture

```
Auto Scaling Configuration
│
├─ Backend Service
│  ├─ Min: 2 tasks
│  ├─ Max: 4 tasks
│  └─ Target: 70% CPU utilization
│     └─ Scales up/down based on demand
│
└─ Frontend Service
   ├─ Min: 2 tasks (static)
   ├─ Max: 2 tasks (currently)
   └─ Status: Manual scaling only
      └─ Can increase if needed
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.2 | UI Framework |
| | Vite | Build tool |
| | Tailwind CSS | Styling |
| | Nginx Alpine | Static file serving & proxy |
| | axios | HTTP client |
| **Backend** | Node.js 20 | Runtime |
| | Express | Web framework |
| | JWT | Authentication |
| | AWS SDK v3 | AWS service integration |
| **Infrastructure** | AWS ECS Fargate | Container orchestration |
| | AWS ALB | Load balancing |
| | AWS VPC | Network isolation |
| | AWS S3 | Image storage |
| | AWS CloudFront | CDN |
| | AWS ECR | Container registry |
| | AWS CloudWatch | Logging & monitoring |
| **IaC** | Terraform | Infrastructure as code |
| | Bash Script | Deployment automation |

## Environment Variables

### Backend Environment
```
NODE_ENV=production
PORT=3000
JWT_SECRET=prod-secret-key-min-32-characters-long
JWT_EXPIRY=3600
AWS_REGION=us-east-1
S3_BUCKET_NAME=sams-suit-shop-images-049475639513
CLOUDFRONT_DOMAIN_NAME=d3on56fzg4so2d.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E3MH39NO97LDX9
```

### Frontend Environment
```
VITE_API_BASE_URL=/api
(Uses relative paths - proxies through nginx)
```

## API Endpoints

### Frontend Endpoints (through ALB)
```
GET  /                      - Homepage
GET  /api/products          - Product list
GET  /api/products/{id}     - Product details
POST /api/authenticate      - User login (JWT)
POST /api/upload            - Image upload to S3
```

### Backend Health
```
GET  /health                - Service health check
```

## Repository Structure

```
sams-suit-shop/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── context/
│   │   └── images/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── services/
│   │   └── middleware/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── terraform/
│   ├── main.tf              (VPC, ECS, ALB)
│   ├── s3_cloudfront.tf     (S3, CloudFront)
│   ├── iam_s3_upload.tf     (IAM roles)
│   ├── variables.tf
│   └── outputs.tf
│
├── scripts/
│   └── deploy.sh            (Automation script)
│
└── docker-compose.yml       (Local development)
```

## Deployment Workflow

```
Option 1: Initial Deployment
$ ./scripts/deploy.sh apply
├─ terraform init
├─ terraform validate
├─ terraform apply
├─ docker buildx build (backend)
├─ docker push (backend → ECR)
├─ docker buildx build (frontend)
├─ docker push (frontend → ECR)
└─ aws ecs update-service (both services)

Option 2: Update Deployment
$ ./scripts/deploy.sh update
├─ docker buildx build (backend)
├─ docker push (backend → ECR)
└─ aws ecs update-service backend

Option 3: Destroy & Rebuild
$ ./scripts/deploy.sh destroy
└─ terraform destroy -auto-approve
$ ./scripts/deploy.sh apply
└─ (Full rebuild as Option 1)
```

## High Availability Features

✓ **Multi-AZ Deployment**
  - Tasks distributed across AZ1 and AZ2
  - ALB spans both AZs

✓ **Auto Scaling**
  - Backend scales 2-4 tasks based on CPU (70% target)
  - Health checks ensure failed tasks are replaced

✓ **Load Balancing**
  - ALB distributes traffic across healthy tasks
  - Connection draining on service updates

✓ **Logging & Monitoring**
  - CloudWatch Logs for all containers
  - Container Insights enabled
  - 7-day log retention

✓ **Fault Tolerance**
  - If one task fails, ALB routes to healthy task
  - New task automatically launched to maintain desired count

## Production Readiness

✓ Infrastructure as Code (Terraform)
✓ Multi-platform Docker builds (linux/amd64)
✓ Blue-green deployments via ALB
✓ SSL/TLS ready (ALB supports HTTPS)
✓ Encrypted S3 storage
✓ CDN for static content
✓ Automated backups (S3 versioning)
✓ Logging & monitoring setup
✓ Security groups & IAM least-privilege
✓ Private subnets for workloads
✓ NAT Gateway for outbound traffic