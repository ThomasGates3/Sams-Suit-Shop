# Sam's Suit Shop - Complete Deployment Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [S3 + CloudFront Setup](#s3--cloudfront-setup)
6. [Deployment Scripts](#deployment-scripts)
7. [Environment Configuration](#environment-configuration)
8. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
9. [Cost Analysis](#cost-analysis)

---

## Quick Start

Deploy the entire application to AWS in one command:

```bash
./scripts/deploy.sh deploy
```

This will:
1. Initialize Terraform
2. Validate configuration
3. Create deployment plan
4. Apply AWS resources
5. Build and push Docker images
6. Update ECS services

---

## Architecture Overview

### Complete Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌────────────────────┐         ┌────────────────────┐
    │   CloudFront CDN   │         │  Application ALB   │
    │  (Images/Assets)   │         │  (API Traffic)     │
    └────────────────────┘         └────────────────────┘
              │                               │
              ▼                               ▼
    ┌────────────────────┐         ┌────────────────────┐
    │    S3 Bucket       │         │   ECS Fargate      │
    │  (Image Storage)   │         │  (Compute)         │
    └────────────────────┘         └────────────────────┘
```

### What Gets Deployed

**Compute & Networking:**
- ECS Fargate Cluster (serverless containers)
- Application Load Balancer (HA load balancing)
- VPC with public/private subnets
- NAT Gateway (secure outbound access)
- Security groups (restrictive firewall rules)

**Container Registry:**
- ECR repositories for backend and frontend images

**Image Serving:**
- S3 bucket with versioning and lifecycle policies
- CloudFront CDN for global image distribution
- IAM roles for secure access
- Security headers and HTTPS enforcement

---

## Prerequisites

### System Requirements
- macOS, Linux, or Windows WSL2
- 2GB+ free disk space
- Internet connection

### Software Installation

```bash
# Terraform (>= 1.0)
brew install terraform

# AWS CLI (v2)
brew install awscli

# Docker (for local testing)
brew install docker
```

### AWS Setup

1. **Create AWS Account** at https://aws.amazon.com
2. **Create IAM User** with programmatic access
3. **Configure AWS CLI:**
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format
```

4. **Verify:**
```bash
aws sts get-caller-identity
```

---

## Step-by-Step Deployment

### Step 1: Initialize Terraform
```bash
./scripts/deploy.sh init
```

### Step 2: Validate Configuration
```bash
./scripts/deploy.sh validate
```

### Step 3: Review Plan
```bash
./scripts/deploy.sh plan
```

### Step 4: Apply Configuration
```bash
./scripts/deploy.sh apply
```

### Step 5: Build Docker Images
```bash
./scripts/deploy.sh build
```

### Step 6: Update ECS Services
```bash
./scripts/deploy.sh update
```

### Step 7: Get Outputs
```bash
./scripts/deploy.sh outputs
```

---

## S3 + CloudFront Setup

### Why S3 + CloudFront?

**Benefits:**
- Unlimited image storage
- Instant updates (no redeployment)
- Global CDN (fast for all users)
- 90% cheaper than serving from ECS
- Industry-standard pattern

### Infrastructure

**S3 Bucket:**
- Versioning enabled (track changes)
- Lifecycle policy (auto-delete old versions after 30 days)
- Block public access (security)
- Private access only through CloudFront

**CloudFront:**
- Global CDN with 200+ edge locations
- 1-year cache TTL for images
- Gzip/Brotli compression
- Security headers (HTTPS, HSTS)

**IAM Roles:**
- S3 upload/download permissions
- CloudFront cache invalidation

### API Endpoints

**POST `/api/upload` (Admin Only)**
Upload image via base64

**POST `/api/upload/presigned` (Admin Only)**
Get pre-signed URL for direct upload

---

## Deployment Scripts

### Interactive Mode
```bash
./scripts/deploy.sh
```

### Command Mode
```bash
./scripts/deploy.sh check        # Verify tools
./scripts/deploy.sh init         # Initialize
./scripts/deploy.sh validate     # Check syntax
./scripts/deploy.sh plan         # Review changes
./scripts/deploy.sh apply        # Create resources
./scripts/deploy.sh build        # Build Docker
./scripts/deploy.sh update       # Update ECS
./scripts/deploy.sh deploy       # Full deployment
./scripts/deploy.sh destroy      # Delete all
```

---

## Environment Configuration

### Create `.env` File
```bash
cp .env.example.production .env
```

Edit with your values:
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
NODE_ENV=production
PORT=3000
JWT_SECRET=change-me-to-secure-random-string
```

---

## Monitoring & Troubleshooting

### View Logs
```bash
# Backend logs
aws logs tail /ecs/sams-suit-shop-backend --follow

# Frontend logs
aws logs tail /ecs/sams-suit-shop-frontend --follow
```

### Common Issues

**ECS tasks not starting:**
```bash
aws ecs describe-services \
  --cluster sams-suit-shop-cluster \
  --services sams-suit-shop-backend
```

**Images not showing:**
```bash
# Test S3
aws s3 ls s3://sams-suit-shop-images-*/

# Test CloudFront
curl -I https://YOUR-DISTRIBUTION.cloudfront.net/products/test.jpg
```

---

## Cost Analysis

### Monthly Costs (100 products, 50GB images)

| Service | Cost |
|---------|------|
| ECS Fargate | $15-30 |
| ALB | $16 |
| NAT Gateway | $32+ |
| S3 Storage | $1.15 |
| CloudFront | $8.50 |
| **Total** | **~$73** |

### Cost Optimization

1. Use Fargate Spot (70% discount)
2. Enable S3 intelligent-tiering
3. Compress images before upload
4. Use WebP format (25% smaller)

---

## Updating the Application

```bash
# Make changes, commit, and redeploy
git add .
git commit -m "Update feature"
./scripts/deploy.sh build
./scripts/deploy.sh update
```

---

## Destroying Infrastructure

```bash
./scripts/deploy.sh destroy
```

**WARNING: This deletes everything including all images in S3!**

---

## References

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [ECS Fargate Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_FARGATE.html)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)

---

## Support

For issues:
1. Check AWS CloudWatch logs
2. Run `terraform show`
3. Check security groups and IAM
4. Review ECS task logs
5. Open GitHub issue with details
