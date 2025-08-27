# Format Forge Visualizer - API Documentation

## Overview
RESTful API for template management, form processing, and document generation. Designed for backend integration and data pipeline workflows.

## Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://format-forge-visualizer.vercel.app/api`

## Authentication
- **Admin APIs**: Require `Authorization: Bearer {jwt_token}`
- **Public APIs**: No authentication required
- **Rate Limiting**: 100 requests/minute per IP

---

## Core Endpoints

### Template Management

#### `GET /api/templates`
**Description**: Retrieve all templates with pagination and filtering
```bash
curl "https://format-forge-visualizer.vercel.app/api/templates?page=1&limit=10&isPublic=true"
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `isPublic` (boolean): Filter public/private templates
- `type` (string): Filter by template type

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Invoice Template",
      "type": "invoice",
      "isPublic": true,
      "fieldPositions": {...},
      "createdAt": "2025-08-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `POST /api/templates`
**Description**: Create new template
```bash
curl -X POST "https://format-forge-visualizer.vercel.app/api/templates" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Form",
    "type": "custom",
    "fields": ["field_0", "field_1", "email"],
    "fieldPositions": {
      "field_0": {"x": 100, "y": 200, "width": 300, "height": 50}
    },
    "imageData": "data:image/png;base64,...",
    "isPublic": false
  }'
```

#### `PUT /api/templates/{id}`
**Description**: Update existing template
```bash
curl -X PUT "https://format-forge-visualizer.vercel.app/api/templates/{id}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldPositions": {...},
    "isPublic": true
  }'
```

### Form Submissions

#### `POST /api/submissions`
**Description**: Submit form data for template processing
```bash
curl -X POST "https://format-forge-visualizer.vercel.app/api/submissions" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "uuid",
    "email": "user@example.com",
    "formData": {
      "field_0": "John Doe",
      "field_1": "Software Engineer",
      "email": "john@example.com"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "submission-uuid",
    "templateId": "template-uuid",
    "formData": {...},
    "processedAt": "2025-08-20T10:00:00Z"
  }
}
```

#### `GET /api/submissions/{templateId}`
**Description**: Retrieve submissions for specific template
```bash
curl "https://format-forge-visualizer.vercel.app/api/submissions/{templateId}?page=1&limit=20"
```

### Document Generation

#### `POST /api/pdf/generate`
**Description**: Generate PDF from template and form data
```bash
curl -X POST "https://format-forge-visualizer.vercel.app/api/pdf/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "uuid",
    "formData": {...},
    "options": {
      "format": "A4",
      "quality": "high",
      "filename": "generated-document.pdf"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://storage.example.com/documents/abc123.pdf",
    "downloadUrl": "https://format-forge-visualizer.vercel.app/api/pdf/download/abc123",
    "fileSize": 245760,
    "generatedAt": "2025-08-20T10:00:00Z"
  }
}
```

### Template Sharing

#### `POST /api/shares`
**Description**: Create shareable link for template
```bash
curl -X POST "https://format-forge-visualizer.vercel.app/api/shares" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "uuid",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "abc123def456",
    "shareUrl": "https://format-forge-visualizer.vercel.app/share/abc123def456",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

#### `GET /api/shares/{token}`
**Description**: Access template via share token
```bash
curl "https://format-forge-visualizer.vercel.app/api/shares/abc123def456"
```

---

## Data Models

### Template Object
```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "fields": ["string"],
  "fieldPositions": {
    "field_id": {
      "x": "number (percentage)",
      "y": "number (percentage)", 
      "width": "number (percentage)",
      "height": "number (percentage)"
    }
  },
  "imageData": "string (base64)",
  "isPublic": "boolean",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### Form Submission Object
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "email": "string",
  "formData": {
    "field_id": "string"
  },
  "processedAt": "ISO 8601"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Integration Examples

### Python (requests)
```python
import requests

# Submit form data
response = requests.post(
    "https://format-forge-visualizer.vercel.app/api/submissions",
    json={
        "templateId": "template-uuid",
        "email": "user@example.com", 
        "formData": {"field_0": "John Doe"}
    }
)

# Generate PDF
pdf_response = requests.post(
    "https://format-forge-visualizer.vercel.app/api/pdf/generate",
    json={
        "templateId": "template-uuid",
        "formData": {"field_0": "John Doe"},
        "options": {"format": "A4"}
    }
)
```

### Node.js (axios)
```javascript
const axios = require('axios');

// Get templates
const templates = await axios.get(
  'https://format-forge-visualizer.vercel.app/api/templates?isPublic=true'
);

// Create template
const newTemplate = await axios.post(
  'https://format-forge-visualizer.vercel.app/api/templates',
  templateData,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### cURL Examples
```bash
# Get public templates
curl "https://format-forge-visualizer.vercel.app/api/templates?isPublic=true"

# Submit form (no auth required)
curl -X POST "https://format-forge-visualizer.vercel.app/api/submissions" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"uuid","email":"user@example.com","formData":{}}'

# Generate PDF
curl -X POST "https://format-forge-visualizer.vercel.app/api/pdf/generate" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"uuid","formData":{}}'
```

---

## Rate Limits & Quotas
- **Public APIs**: 100 requests/minute per IP
- **Authenticated APIs**: 1000 requests/minute per user
- **PDF Generation**: 10 requests/minute per user
- **File Upload**: 10MB per request

---

## Webhook Support (Future)
```json
{
  "event": "submission.created",
  "data": {
    "submissionId": "uuid",
    "templateId": "uuid",
    "email": "user@example.com"
  },
  "timestamp": "2025-08-20T10:00:00Z"
}
```

---

## Support
- **Documentation**: https://format-forge-visualizer.vercel.app/docs
- **Status**: https://format-forge-visualizer.vercel.app/status
- **Contact**: api-support@formatforge.com

---

*Last Updated: August 20, 2025*
*API Version: v1.0*
