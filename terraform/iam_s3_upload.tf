# IAM Role for ECS task to upload images to S3
resource "aws_iam_role" "ecs_task_s3_role" {
  name = "sams-suit-shop-ecs-s3-upload-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ECS Task S3 Upload Role"
    Environment = var.environment
    Project     = "sams-suit-shop"
  }
}

# IAM Policy for S3 upload permissions
resource "aws_iam_role_policy" "ecs_task_s3_policy" {
  name = "sams-suit-shop-ecs-s3-upload-policy"
  role = aws_iam_role.ecs_task_s3_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3UploadPermissions"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.product_images.arn,
          "${aws_s3_bucket.product_images.arn}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidation"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = aws_cloudfront_distribution.product_images.arn
      }
    ]
  })
}

# Outputs
output "ecs_task_s3_role_arn" {
  description = "ARN of the ECS task S3 upload role"
  value       = aws_iam_role.ecs_task_s3_role.arn
}

output "ecs_task_s3_role_name" {
  description = "Name of the ECS task S3 upload role"
  value       = aws_iam_role.ecs_task_s3_role.name
}