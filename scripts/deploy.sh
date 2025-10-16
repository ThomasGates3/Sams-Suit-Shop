#!/bin/bash

# Sam's Suit Shop - AWS Deployment Script
# This script deploys the application to AWS using Terraform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sams-suit-shop"
TERRAFORM_DIR="./terraform"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if terraform is installed
  if ! command -v terraform &> /dev/null; then
    log_error "Terraform is not installed. Please install it from https://www.terraform.io/downloads"
    exit 1
  fi

  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it from https://aws.amazon.com/cli/"
    exit 1
  fi

  # Check if AWS credentials are configured
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials are not configured. Please run 'aws configure'"
    exit 1
  fi

  log_success "All prerequisites are installed"
}

# Initialize Terraform
init_terraform() {
  log_info "Initializing Terraform..."
  cd "$TERRAFORM_DIR"

  terraform init \
    -upgrade \
    -backend=true

  cd - > /dev/null
  log_success "Terraform initialized"
}

# Validate Terraform configuration
validate_terraform() {
  log_info "Validating Terraform configuration..."
  cd "$TERRAFORM_DIR"

  terraform validate

  cd - > /dev/null
  log_success "Terraform configuration is valid"
}

# Format Terraform files
format_terraform() {
  log_info "Formatting Terraform files..."
  cd "$TERRAFORM_DIR"

  terraform fmt -recursive

  cd - > /dev/null
  log_success "Terraform files formatted"
}

# Create Terraform plan
plan_terraform() {
  log_info "Creating Terraform plan..."
  cd "$TERRAFORM_DIR"

  terraform plan \
    -var="aws_region=$AWS_REGION" \
    -var="environment=$ENVIRONMENT" \
    -out=tfplan

  cd - > /dev/null
  log_success "Terraform plan created (tfplan)"
}

# Apply Terraform configuration
apply_terraform() {
  log_info "Applying Terraform configuration..."
  log_warning "This will create/modify AWS resources. Review the plan above."

  read -p "Do you want to proceed with applying Terraform? (yes/no): " confirm

  if [[ "$confirm" != "yes" ]]; then
    log_warning "Terraform apply cancelled"
    return 1
  fi

  cd "$TERRAFORM_DIR"

  terraform apply \
    -var="aws_region=$AWS_REGION" \
    -var="environment=$ENVIRONMENT" \
    tfplan

  cd - > /dev/null
  log_success "Terraform configuration applied"
}

# Get Terraform outputs
get_outputs() {
  log_info "Retrieving deployment outputs..."
  cd "$TERRAFORM_DIR"

  log_info "ALB DNS Name:"
  terraform output -raw alb_dns_name || echo "N/A"

  log_info "CloudFront Domain Name:"
  terraform output -raw cloudfront_domain_name || echo "N/A"

  log_info "S3 Bucket Name:"
  terraform output -raw s3_bucket_name || echo "N/A"

  log_info "ECR Repository URLs:"
  terraform output -json ecr_repository_urls || echo "N/A"

  cd - > /dev/null
}

# Save outputs to file
save_outputs() {
  log_info "Saving deployment outputs..."
  cd "$TERRAFORM_DIR"

  terraform output -json > ../deployment-outputs.json

  cd - > /dev/null
  log_success "Outputs saved to deployment-outputs.json"
}

# Build and push Docker images
build_docker_images() {
  log_info "Building Docker images..."

  # Get ECR repository URLs from Terraform outputs
  cd "$TERRAFORM_DIR"
  ECR_URLS=$(terraform output -json ecr_repository_urls | jq -r '.[]')
  cd - > /dev/null

  # Extract backend and frontend ECR URLs
  BACKEND_ECR=$(echo "$ECR_URLS" | grep "backend" | head -1)
  FRONTEND_ECR=$(echo "$ECR_URLS" | grep "frontend" | head -1)

  if [[ -z "$BACKEND_ECR" ]] || [[ -z "$FRONTEND_ECR" ]]; then
    log_warning "Could not find ECR repository URLs. Skipping Docker build."
    return 0
  fi

  log_info "Backend ECR: $BACKEND_ECR"
  log_info "Frontend ECR: $FRONTEND_ECR"

  # Login to ECR
  log_info "Logging in to ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$(echo $BACKEND_ECR | cut -d'/' -f1)"

  # Build and push backend
  log_info "Building and pushing backend image..."
  docker build -t "$BACKEND_ECR:latest" -f ./backend/Dockerfile ./backend
  docker push "$BACKEND_ECR:latest"
  log_success "Backend image pushed"

  # Build and push frontend
  log_info "Building and pushing frontend image..."
  docker build -t "$FRONTEND_ECR:latest" -f ./frontend/Dockerfile ./frontend
  docker push "$FRONTEND_ECR:latest"
  log_success "Frontend image pushed"
}

# Update ECS services
update_ecs_services() {
  log_info "Updating ECS services..."

  CLUSTER_NAME=$(cd "$TERRAFORM_DIR" && terraform output -raw ecs_cluster_name && cd - > /dev/null)

  # Force new deployment
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service sams-suit-shop-backend \
    --force-new-deployment \
    --region "$AWS_REGION" 2>/dev/null || log_warning "Could not update backend service"

  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service sams-suit-shop-frontend \
    --force-new-deployment \
    --region "$AWS_REGION" 2>/dev/null || log_warning "Could not update frontend service"

  log_success "ECS services updated"
}

# Destroy infrastructure (with confirmation)
destroy_infrastructure() {
  log_warning "This will DELETE all AWS resources created for this project"

  read -p "Are you absolutely sure? Type project name ($PROJECT_NAME) to confirm: " confirm

  if [[ "$confirm" != "$PROJECT_NAME" ]]; then
    log_warning "Destroy cancelled"
    return 1
  fi

  cd "$TERRAFORM_DIR"

  terraform destroy \
    -var="aws_region=$AWS_REGION" \
    -var="environment=$ENVIRONMENT" \
    -auto-approve

  cd - > /dev/null
  log_success "Infrastructure destroyed"
}

# Main menu
show_menu() {
  echo ""
  echo -e "${BLUE}=== Sam's Suit Shop - AWS Deployment ===${NC}"
  echo "1. Check prerequisites"
  echo "2. Initialize Terraform"
  echo "3. Validate configuration"
  echo "4. Format Terraform files"
  echo "5. Plan deployment"
  echo "6. Apply deployment"
  echo "7. Build and push Docker images"
  echo "8. Update ECS services"
  echo "9. Full deployment (init → validate → plan → apply → build → update)"
  echo "10. Get deployment outputs"
  echo "11. Save outputs to file"
  echo "12. Destroy infrastructure (DELETE ALL)"
  echo "0. Exit"
  echo ""
}

# Main execution
main() {
  if [[ $# -eq 0 ]]; then
    # Interactive mode
    while true; do
      show_menu
      read -p "Select an option: " option

      case $option in
        1) check_prerequisites ;;
        2) check_prerequisites && init_terraform ;;
        3) validate_terraform ;;
        4) format_terraform ;;
        5) plan_terraform ;;
        6) apply_terraform ;;
        7) build_docker_images ;;
        8) update_ecs_services ;;
        9)
          check_prerequisites
          init_terraform
          validate_terraform
          format_terraform
          plan_terraform
          apply_terraform
          build_docker_images
          update_ecs_services
          get_outputs
          save_outputs
          ;;
        10) get_outputs ;;
        11) save_outputs ;;
        12) destroy_infrastructure ;;
        0)
          log_info "Exiting..."
          exit 0
          ;;
        *)
          log_error "Invalid option"
          ;;
      esac
    done
  else
    # Command mode
    case "$1" in
      check) check_prerequisites ;;
      init) check_prerequisites && init_terraform ;;
      validate) validate_terraform ;;
      format) format_terraform ;;
      plan) plan_terraform ;;
      apply) apply_terraform ;;
      build) build_docker_images ;;
      update) update_ecs_services ;;
      deploy)
        check_prerequisites
        init_terraform
        validate_terraform
        format_terraform
        plan_terraform
        apply_terraform
        build_docker_images
        update_ecs_services
        get_outputs
        save_outputs
        ;;
      outputs) get_outputs ;;
      save) save_outputs ;;
      destroy) destroy_infrastructure ;;
      *)
        echo "Usage: $0 {check|init|validate|format|plan|apply|build|update|deploy|outputs|save|destroy}"
        exit 1
        ;;
    esac
  fi
}

# Run main function
main "$@"