# S3 bucket for product images
resource "aws_s3_bucket" "product_images" {
  bucket = "sams-suit-shop-images-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "Sam's Suit Shop Product Images"
    Environment = var.environment
    Project     = "sams-suit-shop"
  }
}

# Block public access but allow CloudFront
resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for safety
resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.product_images.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.product_images.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.product_images]
}

# Lifecycle policy to manage old versions (cost optimization)
resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# CloudFront Origin Access Identity for secure S3 access
resource "aws_cloudfront_origin_access_identity" "product_images" {
  comment = "OAI for Sam's Suit Shop product images"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "product_images" {
  origin {
    domain_name              = aws_s3_bucket.product_images.bucket_regional_domain_name
    origin_id                = "S3ProductImages"
    origin_access_control_id = aws_s3_bucket_access_control.product_images.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Only US, Europe, Asia

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3ProductImages"

    # Compress images automatically
    compress = true

    # Cache policy: images cache for 1 year (immutable assets)
    cache_policy_id = aws_cloudfront_cache_policy.product_images.id

    viewer_protocol_policy = "redirect-to-https"

    # Custom headers
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "Sam's Suit Shop CloudFront"
    Environment = var.environment
    Project     = "sams-suit-shop"
  }
}

# Origin Access Control (more secure than OAI)
resource "aws_s3_bucket_access_control" "product_images" {
  name = "sams-suit-shop-oac"

  origin_access_levels = ["S3"]
}

# Custom cache policy for product images
resource "aws_cloudfront_cache_policy" "product_images" {
  name            = "product-images-cache-policy"
  comment         = "Cache policy for product images (1 year)"
  default_ttl     = 31536000 # 1 year
  max_ttl         = 31536000 # 1 year
  min_ttl         = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    query_strings {
      query_string_behavior = "none"
    }

    headers {
      header_behavior = "none"
    }

    cookies {
      cookie_behavior = "none"
    }

    enable_accept_encoding_gzip  = true
    enable_accept_encoding_brotli = true
  }
}

# Security headers policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "product-images-security-headers"
  comment = "Security headers for CloudFront distribution"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = false
      override                   = false
    }

    content_type_options {
      override = false
    }

    frame_options {
      frame_option = "DENY"
      override     = false
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = false
    }
  }
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for product images"
  value       = aws_s3_bucket.product_images.id
}

output "s3_bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.product_images.region
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.product_images.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.product_images.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.product_images.arn
}