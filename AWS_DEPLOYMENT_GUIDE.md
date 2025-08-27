# AWS Deployment Guide - REST APIs

## 🏗️ **AWS Architecture Overview**

### **Recommended AWS Stack:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (S3 + CF)     │◄──►│   (API Gateway) │◄──►│   (RDS)         │
│                 │    │   + Lambda      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Storage       │◄─────────────┘
                        │   (S3)          │
                        └─────────────────┘
```

---

## 📋 **AWS Services Required**

### **Core Services:**
1. **S3** - Static website hosting (Frontend)
2. **CloudFront** - CDN and HTTPS
3. **API Gateway** - REST API endpoints
4. **Lambda** - Serverless backend functions
5. **RDS** - PostgreSQL database
6. **S3** - File storage (templates, PDFs)
7. **IAM** - Security and permissions

### **Optional Services:**
8. **Route 53** - Custom domain
9. **Certificate Manager** - SSL certificates
10. **CloudWatch** - Monitoring and logging
11. **Cognito** - User authentication

---

## 🚀 **Step-by-Step Implementation**

### **Phase 1: Database Setup (RDS)**

#### **1.1 Create PostgreSQL RDS Instance**
```bash
# AWS CLI commands
aws rds create-db-instance \
  --db-instance-identifier format-forge-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-name formatforge
```

#### **1.2 Database Schema**
```sql
-- Run this in your RDS PostgreSQL instance
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    fields JSONB,
    field_positions JSONB,
    image_data TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id),
    email VARCHAR(255),
    form_data JSONB,
    processed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE template_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id),
    token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0
);
```

### **Phase 2: Backend API (Lambda + API Gateway)**

#### **2.1 Create Lambda Functions**

**Template Management Function:**
```javascript
// lambda/templates/index.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const { httpMethod, pathParameters, queryStringParameters, body } = event;
  
  try {
    switch (httpMethod) {
      case 'GET':
        return await getTemplates(queryStringParameters);
      case 'POST':
        return await createTemplate(JSON.parse(body));
      case 'PUT':
        return await updateTemplate(pathParameters.id, JSON.parse(body));
      case 'DELETE':
        return await deleteTemplate(pathParameters.id);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getTemplates(params) {
  const { isPublic, page = 1, limit = 10 } = params || {};
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM templates';
  const values = [];
  
  if (isPublic !== undefined) {
    query += ' WHERE is_public = $1';
    values.push(isPublic === 'true');
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
  values.push(parseInt(limit), offset);
  
  const result = await pool.query(query, values);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    })
  };
}
```

**Form Submissions Function:**
```javascript
// lambda/submissions/index.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;
  
  try {
    switch (httpMethod) {
      case 'POST':
        return await createSubmission(JSON.parse(body));
      case 'GET':
        return await getSubmissions(pathParameters.templateId);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function createSubmission(data) {
  const { templateId, email, formData } = data;
  
  const result = await pool.query(
    'INSERT INTO form_submissions (template_id, email, form_data) VALUES ($1, $2, $3) RETURNING *',
    [templateId, email, JSON.stringify(formData)]
  );
  
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      data: result.rows[0]
    })
  };
}
```

#### **2.2 Create API Gateway**

**API Gateway Configuration:**
```yaml
# api-gateway.yaml
openapi: 3.0.0
info:
  title: Format Forge API
  version: 1.0.0
paths:
  /templates:
    get:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:templates-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
    post:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:templates-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
  
  /templates/{id}:
    get:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:templates-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
    put:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:templates-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
    delete:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:templates-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
  
  /submissions:
    post:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:submissions-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
  
  /submissions/{templateId}:
    get:
      x-amazon-apigateway-integration:
        uri: arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:submissions-function/invocations
        passthroughBehavior: when_no_match
        httpMethod: POST
        type: aws_proxy
```

### **Phase 3: Frontend Deployment (S3 + CloudFront)**

#### **3.1 Build and Deploy Frontend**
```bash
# Build the React app
npm run build

# Create S3 bucket for static hosting
aws s3 mb s3://format-forge-frontend

# Enable static website hosting
aws s3 website s3://format-forge-frontend --index-document index.html --error-document index.html

# Upload built files
aws s3 sync dist/ s3://format-forge-frontend --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### **3.2 Update Frontend Configuration**
```javascript
// src/config/aws.js
export const AWS_CONFIG = {
  API_BASE_URL: 'https://your-api-gateway-url.amazonaws.com/prod',
  S3_BUCKET: 'format-forge-storage',
  REGION: 'us-east-1'
};

// src/services/apiService.js
import axios from 'axios';
import { AWS_CONFIG } from '../config/aws';

const apiClient = axios.create({
  baseURL: AWS_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  // Templates
  getTemplates: (params) => apiClient.get('/templates', { params }),
  createTemplate: (data) => apiClient.post('/templates', data),
  updateTemplate: (id, data) => apiClient.put(`/templates/${id}`, data),
  deleteTemplate: (id) => apiClient.delete(`/templates/${id}`),
  
  // Submissions
  createSubmission: (data) => apiClient.post('/submissions', data),
  getSubmissions: (templateId) => apiClient.get(`/submissions/${templateId}`),
  
  // PDF Generation
  generatePDF: (data) => apiClient.post('/pdf/generate', data)
};
```

### **Phase 4: File Storage (S3)**

#### **4.1 Create Storage Bucket**
```bash
# Create S3 bucket for file storage
aws s3 mb s3://format-forge-storage

# Configure CORS for the bucket
aws s3api put-bucket-cors --bucket format-forge-storage --cors-configuration file://cors-config.json
```

#### **4.2 CORS Configuration**
```json
// cors-config.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

---

## 🔐 **Security & Authentication**

### **IAM Roles and Policies**
```json
// lambda-execution-role.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::format-forge-storage/*"
    }
  ]
}
```

### **API Gateway Authentication (Optional)**
```javascript
// Lambda authorizer
exports.handler = async (event) => {
  const token = event.authorizationToken;
  
  // Verify JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      principalId: decoded.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn
        }]
      }
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
};
```

---

## 📊 **Monitoring & Logging**

### **CloudWatch Setup**
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/lambda/templates-function
aws logs create-log-group --log-group-name /aws/lambda/submissions-function

# Set retention policy
aws logs put-retention-policy --log-group-name /aws/lambda/templates-function --retention-in-days 14
```

### **CloudWatch Alarms**
```bash
# Create error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "API-Error-Rate" \
  --alarm-description "API Gateway 5XX errors" \
  --metric-name "5XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold"
```

---

## 💰 **Cost Estimation**

### **Monthly Costs (US East 1):**
- **RDS (db.t3.micro)**: ~$15/month
- **Lambda**: ~$5/month (100K requests)
- **API Gateway**: ~$3/month (1M requests)
- **S3**: ~$2/month (10GB storage)
- **CloudFront**: ~$5/month (100GB transfer)
- **Route 53**: ~$1/month (hosted zone)

**Total**: ~$31/month

### **Free Tier Available:**
- **Lambda**: 1M requests/month
- **API Gateway**: 1M requests/month
- **S3**: 5GB storage
- **CloudFront**: 1TB transfer
- **RDS**: 750 hours/month (db.t3.micro)

**Free Tier Total**: ~$0/month (first 12 months)

---

## 🚀 **Deployment Scripts**

### **Terraform Configuration (Recommended)**
```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# RDS Instance
resource "aws_db_instance" "format_forge" {
  identifier           = "format-forge-db"
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_type         = "gp2"
  username             = "admin"
  password             = var.db_password
  db_name              = "formatforge"
  skip_final_snapshot  = true
}

# Lambda Functions
resource "aws_lambda_function" "templates" {
  filename         = "lambda/templates.zip"
  function_name    = "templates-function"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  environment {
    variables = {
      DB_HOST     = aws_db_instance.format_forge.endpoint
      DB_NAME     = aws_db_instance.format_forge.db_name
      DB_USER     = aws_db_instance.format_forge.username
      DB_PASSWORD = aws_db_instance.format_forge.password
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "format_forge" {
  name = "format-forge-api"
}

# S3 Bucket
resource "aws_s3_bucket" "frontend" {
  bucket = "format-forge-frontend"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
}
```

### **Deployment Commands**
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure
terraform apply

# Deploy Lambda functions
aws lambda update-function-code --function-name templates-function --zip-file fileb://lambda/templates.zip

# Deploy frontend
npm run build
aws s3 sync dist/ s3://format-forge-frontend --delete
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

---

## 🔧 **Alternative: Docker + ECS**

### **Dockerfile for Backend**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### **ECS Task Definition**
```json
{
  "family": "format-forge-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/format-forge-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "format-forge-db.xxxxx.us-east-1.rds.amazonaws.com"
        }
      ]
    }
  ]
}
```

---

## 📞 **Next Steps**

### **Immediate Actions:**
1. **Choose deployment method** (Terraform recommended)
2. **Set up AWS account** with appropriate permissions
3. **Create RDS instance** and run database schema
4. **Deploy Lambda functions** with proper IAM roles
5. **Configure API Gateway** with CORS and authentication
6. **Deploy frontend** to S3 with CloudFront

### **Timeline:**
- **Day 1**: Infrastructure setup (RDS, S3, IAM)
- **Day 2**: Lambda functions and API Gateway
- **Day 3**: Frontend deployment and testing
- **Day 4**: Security and monitoring setup
- **Day 5**: Production deployment and optimization

### **Support Resources:**
- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Documentation**: https://www.terraform.io/docs
- **Serverless Framework**: https://www.serverless.com/

---

**Ready to proceed with AWS deployment? Let me know which approach you prefer!** 🚀
