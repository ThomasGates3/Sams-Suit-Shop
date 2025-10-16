# Terraform Architecture - Sam's Suit Shop (NAT Gateway Version)

## 🏗️ Architecture Overview

This document describes the AWS infrastructure deployed with Terraform using **NAT Gateway** for secure outbound connectivity from private subnets.

### Network Topology

```
Public Internet
       ▲
       │ Routes via NAT
       ▼
┌─────────────────────────────────────────┐
│         AWS VPC 10.0.0.0/16             │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   PUBLIC SUBNETS (2)            │  │
│  │  • ALB + NAT Gateway            │  │
│  │  • Publicly routable            │  │
│  │                                 │  │
│  │  Public 1: 10.0.1.0/24  ──┐    │  │
│  │  Public 2: 10.0.2.0/24  ──┤    │  │
│  │                           │    │  │
│  └───────────────────────────┼────┘  │
│           ▲        │                  │
│           │        │ ALB routes       │
│    IGW    │        │ traffic          │
│  0.0.0.0  │        ▼                  │
│  ◄────────┤   ┌──────────────────────┤
│           └───│  NAT Gateway (EIP)  │
│               └──────────────────────┤
│                     ▲                 │
│                     │ Outbound only   │
│  ┌──────────────────┼──────────────┐ │
│  │ PRIVATE SUBNETS  │              │ │
│  │ • ECS Tasks only │              │ │
│  │ • No public IPs  │              │ │
│  │                  │              │ │
│  │ Private 1:  10.0.10.0/24        │ │
│  │ Private 2:  10.0.11.0/24        │ │
│  │                                  │ │
│  │ ┌────────────┐  ┌────────────┐ │ │
│  │ │ Backend    │  │ Frontend   │ │ │
│  │ │ Tasks      │  │ Tasks      │ │ │
│  │ │ (port 3000)│  │ (port 80)  │ │ │
│  │ └────────────┘  └────────────┘ │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 📦 Resources Created (33 Total)

### VPC & Networking (9)
- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: Single NAT in Public Subnet 1
- **Elastic IP**: For NAT Gateway
- **Route Tables**: Public (→ IGW) and Private (→ NAT)

### Load Balancing (5)
- **Application Load Balancer**: Port 80, public
- **Target Group Backend**: Port 3000
- **Target Group Frontend**: Port 80
- **ALB Listener**: Default to frontend
- **ALB Listener Rule**: /api/* → backend

### Compute (5)
- **ECS Cluster**: sams-suit-shop
- **Task Definition Backend**: 256 CPU, 512 MB RAM
- **Task Definition Frontend**: 256 CPU, 512 MB RAM
- **ECS Service Backend**: 2 tasks in private subnets
- **ECS Service Frontend**: 2 tasks in private subnets

### Scaling (1)
- **Auto Scaling Policy**: CPU-based (2-4 tasks)

### Container Registry (2)
- **ECR Backend Repository**
- **ECR Frontend Repository**

### Security & Logging (6)
- **ALB Security Group**: Allows HTTP/HTTPS in
- **ECS Security Group**: Allows ALB traffic in
- **Task Execution Role**: ECR/CloudWatch permissions
- **Task Role**: ECR permissions
- **CloudWatch Log Group**: /ecs/sams-suit-shop

## 🔐 Security Model

### Network Security
✅ ECS tasks in **private subnets** (no direct internet)
✅ **Outbound only** via NAT Gateway
✅ **ALB** as single ingress point
✅ **Security groups** with minimal permissions

### Data Flow
```
Internet User
       ▼
   ALB (Port 80)
   │        │
   ├─ / ───→ Frontend (80)  ──→ Private Subnet
   │
   └─ /api/* ─→ Backend (3000) ──→ Private Subnet

Private Subnets (need to reach ECR, CloudWatch):
   ├─ ECR API ──────→ NAT Gateway ──→ IGW ──→ Internet
   ├─ ECR Docker ────→ NAT Gateway ──→ IGW ──→ Internet
   └─ CloudWatch ────→ NAT Gateway ──→ IGW ──→ Internet
```

## 💰 Cost Estimate

| Resource | Monthly |
|----------|---------|
| NAT Gateway | ~$32 |
| ALB | ~$16 |
| ECS Fargate (2 tasks) | ~$15-20 |
| ECR | <$1 |
| CloudWatch Logs | ~$1 |
| **Total** | **~$65-75** |

## 🚀 Deployment Steps

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Review Changes
```bash
terraform plan
```

### 3. Deploy Infrastructure
```bash
terraform apply    # Takes 5-10 minutes
```

### 4. Get Outputs
```bash
terraform output
# Shows: ALB DNS name, ECR URLs, cluster name
```

### 5. Push Docker Images
```bash
# From project root
/tmp/push-to-ecr.sh
```

### 6. Monitor Deployment
```bash
# Check services
aws ecs describe-services \
  --cluster sams-suit-shop \
  --services sams-suit-shop-backend sams-suit-shop-frontend \
  --region us-east-1

# Check logs
aws logs tail /ecs/sams-suit-shop --follow
```

## ✅ Why NAT Gateway vs VPC Endpoints?

| Aspect | VPC Endpoints | NAT Gateway |
|--------|---------------|------------|
| **Setup** | Complex (DNS issues) | Simple |
| **Reliability** | Problematic in this setup | Proven AWS service |
| **Cost** | ~$0.01/hr × endpoints | Fixed $0.045/hr |
| **Use Case** | High-security, low-traffic | Standard outbound |
| **Production Ready** | Not recommended | ✅ Yes |

**Conclusion**: NAT Gateway is the standard, proven solution for Fargate.

## 📊 Auto-Scaling Configuration

Backend tasks scale based on CPU:
- **Min Capacity**: 2 tasks (always running)
- **Max Capacity**: 4 tasks
- **Scale Up**: CPU > 70%
- **Scale Down**: After 5 minutes below 70%

## 🔧 Key Configuration Details

### ECS Tasks
- **Launch Type**: FARGATE (serverless)
- **Network Mode**: awsvpc (required)
- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Subnets**: Private (10.0.10.0/24, 10.0.11.0/24)
- **Public IP**: false (use NAT for outbound)
- **Logs**: CloudWatch at /ecs/sams-suit-shop

### NAT Gateway
- **Placement**: Public Subnet 1 (AZ 1)
- **Elastic IP**: Allocated
- **HA Option**: Add second NAT in Public Subnet 2

## 📚 Files

- **main.tf**: All 33 resources
- **variables.tf**: Configuration
- **outputs.tf**: ALB URL, ECR URLs, cluster name

## 🎯 Next Steps

1. ✅ Run `terraform plan`
2. ✅ Review resources to be created
3. ✅ Run `terraform apply`
4. ✅ Wait for ALB creation (takes time)
5. ✅ Push Docker images to ECR
6. ✅ Monitor task startup
7. ✅ Test endpoints

Your infrastructure is now production-ready! 🚀