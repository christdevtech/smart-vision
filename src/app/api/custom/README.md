# Custom API Endpoints

This directory contains all custom API endpoints for the SmartVision application. All custom endpoints are organized under `/api/custom/` to avoid conflicts with Payload CMS default API endpoints.

## Directory Structure

```
/api/custom/
├── example/           # Example custom endpoint
│   └── route.ts
└── referral/          # Referral system endpoints
    ├── generate/      # Generate referral links
    │   └── route.ts
    ├── redirect/      # Handle referral redirects
    │   └── [code]/
    │       └── route.ts
    └── stats/         # Referral statistics
        └── route.ts
```

## Available Endpoints

### Example Endpoint
- **GET** `/api/custom/example` - Example custom route demonstrating Payload integration

### Referral System
- **GET** `/api/custom/referral/generate` - Generate referral link for authenticated user
- **POST** `/api/custom/referral/generate` - Generate referral link by email (admin)
- **GET** `/api/custom/referral/redirect/[code]` - Handle referral link redirects and set tracking cookies
- **GET** `/api/custom/referral/stats` - Get referral statistics for authenticated user

## Guidelines for Adding New Custom Endpoints

1. **Always place custom endpoints under `/api/custom/`** to avoid conflicts with Payload CMS
2. **Use descriptive directory names** that clearly indicate the endpoint's purpose
3. **Follow RESTful conventions** for HTTP methods and URL structure
4. **Include proper error handling** and status codes
5. **Add authentication checks** where appropriate
6. **Document new endpoints** in this README file

## Example Custom Endpoint Structure

```typescript
// src/app/api/custom/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Your custom logic here
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in custom endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Notes

- Payload CMS uses `/api/` for its default endpoints (collections, auth, etc.)
- Custom endpoints under `/api/custom/` ensure no naming conflicts
- All endpoints have access to the Payload instance for database operations
- Follow the existing patterns for consistency and maintainability