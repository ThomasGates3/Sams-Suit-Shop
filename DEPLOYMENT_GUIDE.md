# Sam's Suit Shop - CI/CD & AWS Deployment Guide

## 📋 Prerequisites

- AWS Account with appropriate IAM permissions
- GitHub repository with secrets configured
- Terraform >= 1.0
- AWS CLI configured

---

## 🔐 Step 1: Set Up GitHub Secrets

Go to: `GitHub Repo → Settings → Secrets and variables → Actions`

Add these **Repository Secrets:**

```
AWS_ACCOUNT_ID          → Your AWS Account ID (12 digits)
AWS_ACCESS_KEY_ID       → IAM User Access Key
AWS_SECRET_ACCESS_KEY   → IAM User Secret Key
AWS_REGION              → us-east-1 (or your region)
```

**How to get AWS credentials:**
```bash
# Create IAM user in AWS Console:
# 1. Go to IAM → Users → Create User
# 2. Grant permissions: AmazonEC2ContainerRegistryPowerUser, AmazonECS_FullAccess
# 3. Create access key and copy the credentials
```

---

## 🚀 Step 2: Deploy Infrastructure with Terraform

### Initialize Terraform

```bash
cd terraform
terraform init
```

### Plan Deployment

```bash
terraform plan
```

Review the resources that will be created.

### Apply Configuration

```bash
terraform apply
```

Type `yes` to confirm. This creates:
- VPC, Subnets, Internet Gateway
- Application Load Balancer
- ECS Cluster, Task Definitions, Services
- ECR Repositories
- Auto-scaling policies
- CloudWatch Logs

**Expected time:** 5-10 minutes

---

## ✅ Testing After Terraform

### Get ALB URL

```bash
terraform output alb_dns_name
```

### Test Frontend

```bash
curl http://<ALB_DNS_NAME>
# Should return HTML with "Sam's Suit Shop"
```

### Test Backend

```bash
curl http://<ALB_DNS_NAME>/api/products
# Should return JSON with products
```

### Check ECS Services

```bash
aws ecs describe-services \
  --cluster sams-suit-shop \
  --services sams-suit-shop-backend sams-suit-shop-frontend \
  --region us-east-1
```

---

## 🔄 Step 3: Trigger CI/CD Pipeline

### Automatic Trigger (Recommended)

1. Make a code change and push to `main` branch
   ```bash
   git add .
   git commit -m "Update code"
   git push origin main
   ```

2. Go to GitHub → Actions tab
3. Watch the workflow run

### Manual Trigger (Optional)

```bash
# Push code without changes
git commit --allow-empty -m "Trigger pipeline"
git push origin main
```

---

## 📊 Testing the Pipeline

### Test 1: View GitHub Actions Logs

1. Go to `GitHub Repo → Actions`
2. Click the latest workflow run
3. Expand each step to view logs

Expected steps:
- ✅ Test backend
- ✅ Test frontend
- ✅ Build and push backend to ECR
- ✅ Build and push frontend to ECR
- ✅ Update ECS services

### Test 2: Verify ECR Images

```bash
aws ecr describe-images \
  --repository-name sams-suit-shop-backend \
  --region us-east-1

aws ecr describe-images \
  --repository-name sams-suit-shop-frontend \
  --region us-east-1
```

### Test 3: Check ECS Task Status

```bash
aws ecs list-tasks \
  --cluster sams-suit-shop \
  --service-name sams-suit-shop-backend \
  --region us-east-1

aws ecs describe-tasks \
  --cluster sams-suit-shop \
  --tasks <TASK_ARN> \
  --region us-east-1
```

### Test 4: Monitor CloudWatch Logs

```bash
# View backend logs
aws logs tail /ecs/sams-suit-shop/backend --follow

# View frontend logs
aws logs tail /ecs/sams-suit-shop/frontend --follow
```

---

## 🧪 Local Testing Before Pipeline

### Test Backend Locally

```bash
cd backend
npm install
npm test
npm run build
```

### Test Frontend Locally

```bash
cd frontend
npm install
npm test
npm run build
```

### Test Docker Build Locally

```bash
docker build -t sams-suit-shop-backend:test ./backend
docker build -t sams-suit-shop-frontend:test ./frontend

docker run -p 3000:3000 sams-suit-shop-backend:test
docker run -p 5173:80 sams-suit-shop-frontend:test
```

---

## 🔍 Common Issues & Solutions

### Issue: ECS tasks stuck in PENDING

```bash
# Check service events
aws ecs describe-services \
  --cluster sams-suit-shop \
  --services sams-suit-shop-backend \
  --region us-east-1 \
  --query 'services[0].events[:3]'
```

### Issue: ECR login fails in GitHub Actions

Verify AWS credentials in GitHub secrets are correct:
```bash
# Test locally
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Issue: Health check failing

Check task logs:
```bash
aws logs tail /ecs/sams-suit-shop/backend --follow
```

---

## 💰 Cost Estimation

- **Fargate:** ~$30-50/month (2 tasks per service)
- **ECR:** ~$0.10/GB/month (minimal storage)
- **ALB:** ~$16/month
- **Data transfer:** ~$1-5/month
- **Total:** ~$50-75/month

---

## 🛠️ Cleanup (When Done)

Destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

Type `yes` to confirm. This removes:
- All VPC resources
- ECS services and cluster
- Load balancer
- ECR repositories (with images)

---

## 📝 Pipeline Workflow Summary

```
Developer Push to main
         ↓
GitHub Actions Triggered
         ↓
Run Tests (backend + frontend)
         ↓
Build Docker Images
         ↓
Push to AWS ECR
         ↓
Update ECS Services
         ↓
ECS Pulls New Images
         ↓
New Tasks Start
         ↓
Load Balancer Routes Traffic
         ↓
✅ Website Updated
```

---

## 🎯 Next Steps

1. ✅ Set GitHub secrets
2. ✅ Run `terraform apply`
3. ✅ Wait for infrastructure (5-10 min)
4. ✅ Test ALB endpoints
5. ✅ Make a code change and push
6. ✅ Watch GitHub Actions run
7. ✅ Verify new deployment

Happy deploying! 🚀