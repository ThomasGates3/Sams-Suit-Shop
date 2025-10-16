# Sam's Suit Shop - Deployment Guide

Complete guide for deploying the application to AWS and other cloud platforms.

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (optional, if not using Docker)

### Running Locally with Docker Compose

```bash
# Clone and navigate to project
cd sams-suit-shop

# Start all services
docker-compose up

# In another terminal, seed the database
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Backend Health: http://localhost:3000/health
```

### Running Tests Locally

```bash
# Backend tests
cd backend
npm install
npm test

# Frontend tests
cd frontend
npm install
npm test

# All tests with coverage
npm run test:coverage
```

---

## AWS Deployment

### Architecture Overview

```
CloudFront (CDN)
    ↓
ALB (Application Load Balancer)
    ├─→ ECS Fargate (Frontend - Nginx)
    └─→ ECS Fargate (Backend - Node.js)
        ↓
    RDS PostgreSQL (Production Database)
    S3 (Static Assets/Images)
```

### Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI configured (`aws configure`)
- Docker CLI
- Terraform (optional but recommended)

### Step 1: Prepare AWS Environment

```bash
# Create ECR repositories
aws ecr create-repository --repository-name sams-suit-shop-backend --region us-east-1
aws ecr create-repository --repository-name sams-suit-shop-frontend --region us-east-1

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Docker Images

```bash
# Set variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
BACKEND_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/sams-suit-shop-backend
FRONTEND_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/sams-suit-shop-frontend

# Build backend image
docker build -t $BACKEND_REPO:latest ./backend
docker push $BACKEND_REPO:latest

# Build frontend image
docker build -t $FRONTEND_REPO:latest ./frontend
docker push $FRONTEND_REPO:latest
```

### Step 3: Database Setup (RDS PostgreSQL)

#### Manual AWS Console Setup

1. Navigate to RDS → Databases → Create database
2. Choose PostgreSQL engine
3. Configuration:
   - Engine version: 15.x
   - Instance class: db.t3.micro (dev) or db.t3.small (prod)
   - Allocated storage: 20 GB
   - Storage auto-scaling: Enabled
4. Credentials:
   - Master username: `postgres`
   - Master password: Generate strong password, store in AWS Secrets Manager
5. VPC: Use default VPC or create new
6. Publicly accessible: No (for security)
7. Create database

#### Environment Variables for RDS

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@suit-shop-db.XXXX.us-east-1.rds.amazonaws.com:5432/suit_shop
DB_HOST=suit-shop-db.XXXX.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=suit_shop
DB_USER=postgres
DB_PASSWORD=your-secure-password
```

### Step 4: Create ECS Cluster

#### Using AWS Console

1. ECS → Clusters → Create Cluster
2. Name: `sams-suit-shop-cluster`
3. Infrastructure: AWS Fargate
4. Create cluster

### Step 5: Create ECS Task Definitions

#### Backend Task Definition

```bash
# File: backend-task-definition.json
{
  "family": "sams-suit-shop-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sams-suit-shop-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:suit-shop-db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:suit-shop-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sams-suit-shop-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole"
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
```

#### Frontend Task Definition

```bash
# File: frontend-task-definition.json
{
  "family": "sams-suit-shop-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sams-suit-shop-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sams-suit-shop-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole"
}
```

### Step 6: Create ECS Services

#### Backend Service

```bash
aws ecs create-service \
  --cluster sams-suit-shop-cluster \
  --service-name sams-suit-shop-backend \
  --task-definition sams-suit-shop-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

#### Frontend Service

```bash
aws ecs create-service \
  --cluster sams-suit-shop-cluster \
  --service-name sams-suit-shop-frontend \
  --task-definition sams-suit-shop-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=80 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

### Step 7: Set Up Application Load Balancer (ALB)

#### Create ALB

```bash
aws elbv2 create-load-balancer \
  --name sams-suit-shop-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing
```

#### Create Target Groups

```bash
# Backend target group
aws elbv2 create-target-group \
  --name sams-suit-shop-backend \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip

# Frontend target group
aws elbv2 create-target-group \
  --name sams-suit-shop-frontend \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxx \
  --target-type ip
```

#### Create Listeners and Rules

```bash
# Listener on port 80
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# Rule for /api/* → Backend
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --conditions Field=path-pattern,Values="/api/*" \
  --priority 1 \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...(backend)

# Rule for /* → Frontend (default)
# This is already the default action
```

### Step 8: Set Up Secrets Manager

Store sensitive data in AWS Secrets Manager:

```bash
# Database URL
aws secretsmanager create-secret \
  --name suit-shop-db-url \
  --secret-string "postgresql://postgres:PASSWORD@suit-shop-db.xxx.us-east-1.rds.amazonaws.com:5432/suit_shop"

# JWT Secret
aws secretsmanager create-secret \
  --name suit-shop-jwt-secret \
  --secret-string "your-secure-jwt-secret-key-min-32-chars"
```

### Step 9: Set Up CloudFront (CDN)

```bash
aws cloudfront create-distribution \
  --origin-domain-name sams-suit-shop-alb-xxx.us-east-1.elb.amazonaws.com \
  --default-root-object index.html \
  --viewer-protocol-policy redirect-to-https \
  --default-cache-behavior ViewerProtocolPolicy=redirect-to-https
```

### Step 10: Configure Auto Scaling

#### Backend Auto Scaling

```bash
# Create scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/sams-suit-shop-cluster/sams-suit-shop-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name backend-scale-up \
  --service-namespace ecs \
  --resource-id service/sams-suit-shop-cluster/sams-suit-shop-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}"
```

### Step 11: Set Up Monitoring

#### CloudWatch Logs

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/sams-suit-shop-backend
aws logs create-log-group --log-group-name /ecs/sams-suit-shop-frontend

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/sams-suit-shop-backend \
  --retention-in-days 30
```

#### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name sams-suit-shop-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Terraform Deployment (Recommended)

Create a `terraform/` directory with infrastructure-as-code:

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "sams-suit-shop-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "sams-suit-shop-db"

  engine            = "postgres"
  engine_version    = "15.4"
  family            = "postgres15"
  major_engine_version = "15"

  instance_class = "db.t3.micro"
  allocated_storage = 20

  db_name  = "suit_shop"
  username = "postgres"
  password = random_password.db_password.result
  port     = 5432

  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot = true

  depends_on = [module.vpc]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "sams-suit-shop-cluster"
}

# ALB
resource "aws_lb" "main" {
  name               = "sams-suit-shop-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

# Add more resources as needed...
```

### Deploy with Terraform

```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Outputs will show ALB DNS, database endpoint, etc.
terraform output
```

---

## Post-Deployment

### Initialize Database

```bash
# Connect to RDS
psql -h ENDPOINT -U postgres -d suit_shop

# Run migrations (create tables)
\i migrations/001_init_schema.sql

# Seed data
INSERT INTO products (...) VALUES (...);
```

### Run Health Checks

```bash
# Check backend health
curl https://your-domain.com/api/health

# Check frontend
curl https://your-domain.com
```

### Set Up DNS

1. AWS Route 53 → Create hosted zone
2. Add CNAME record pointing to ALB DNS name
3. Configure SSL/TLS certificate (AWS Certificate Manager)

### Enable HTTPS

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --ssl-policy ELBSecurityPolicy-TLS-1-2-2017-01 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Monitoring & Maintenance

### CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name SuitShopDashboard \
  --dashboard-body file://dashboard.json
```

### Log Aggregation

```bash
# View logs
aws logs tail /ecs/sams-suit-shop-backend --follow

# Filter logs
aws logs tail /ecs/sams-suit-shop-backend --follow --filter-pattern "ERROR"
```

### Database Backups

```bash
# Automated backups (configured in RDS)
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier sams-suit-shop-db \
  --db-snapshot-identifier sams-suit-shop-backup-$(date +%Y%m%d)
```

---

## Troubleshooting

### Services not starting

```bash
# Check ECS service logs
aws ecs describe-services \
  --cluster sams-suit-shop-cluster \
  --services sams-suit-shop-backend \
  --query 'services[0].events'

# Check CloudWatch logs
aws logs tail /ecs/sams-suit-shop-backend --follow
```

### Database connection issues

```bash
# Test connection
psql -h ENDPOINT -U postgres -d suit_shop -c "SELECT 1"

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxx
```

### ALB health check failures

```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Verify health check endpoint
curl http://TASK_IP:3000/health
```

---

## Cost Optimization

- Use t3 instances (burstable) for non-prod
- Enable S3 lifecycle policies for old logs
- Set up CloudWatch alarms for billing
- Use spot instances for non-critical tasks
- Enable auto-scaling to scale down during off-peak

---

## Security Checklist

- [ ] Enable VPC Flow Logs
- [ ] Configure Security Groups (principle of least privilege)
- [ ] Enable encryption at rest (RDS, EBS)
- [ ] Enable encryption in transit (TLS/HTTPS)
- [ ] Store secrets in Secrets Manager
- [ ] Enable CloudTrail for audit logs
- [ ] Configure WAF rules on ALB
- [ ] Enable GuardDuty for threat detection
- [ ] Regular security group audits
- [ ] Implement rate limiting

---

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, CodePipeline)
2. Implement database migrations
3. Add more comprehensive monitoring
4. Set up automated backups
5. Configure disaster recovery procedures