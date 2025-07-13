# SmartVision Referral System

The SmartVision referral system allows users to refer new users to the platform using unique referral codes and HTTP-only cookies for secure tracking.

## Overview

The referral system consists of:
- **Unique referral codes** automatically generated for each user
- **HTTP-only cookies** for secure referral tracking
- **Automatic referral attribution** during user registration
- **Referral statistics** and dashboard for users
- **API endpoints** for referral management

## How It Works

### 1. Referral Code Generation
- Every new user automatically gets a unique 7-digit referral code
- Codes are generated using `generateUniqueCode()` function
- Codes are stored in the `referralCode` field of the user document

### 2. Referral Link Sharing
- Users can share their referral link: `https://yoursite.com/api/custom/referral/redirect/{referralCode}`
- When someone clicks the link, they're redirected to the homepage
- An HTTP-only cookie is set with referral information

### 3. Referral Tracking
- When a new user registers, the system checks for the referral cookie
- If a valid cookie exists, the new user is linked to the referrer
- The referrer's `totalReferrals` count is automatically incremented

### 4. Cookie Security
- Cookies are HTTP-only (not accessible via JavaScript)
- Secure flag enabled in production
- 30-day expiration period
- SameSite=lax for CSRF protection

## API Endpoints

### GET `/api/custom/referral/redirect/[code]`
Handles incoming referral links and sets tracking cookies.

**Parameters:**
- `code` (path parameter): The referral code

**Response:**
- Redirects to homepage with referral cookie set
- Returns 404 if referral code is invalid

### GET `/api/custom/referral/generate`
Generates a referral link for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "referralCode": "1234567",
  "referralLink": "https://yoursite.com/api/custom/referral/redirect/1234567",
  "totalReferrals": 5
}
```

### POST `/api/custom/referral/generate`
Generates a referral link for a user by email (admin use).

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "referralCode": "1234567",
  "referralLink": "https://yoursite.com/api/custom/referral/redirect/1234567",
  "totalReferrals": 5
}
```

### GET `/api/custom/referral/stats`
Retrieve referral statistics for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "referralCode": "1234567",
  "referralLink": "https://yoursite.com/api/custom/referral/redirect/1234567",
  "totalReferrals": 5,
  "referredUsers": [
    {
      "id": "user_id",
      "email": "referred@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "referredBy": "referrer_user_id"
}
```

## Database Schema

The referral system adds the following fields to the Users collection:

```typescript
{
  referralCode: {
    type: 'text',
    unique: true,
    admin: {
      readOnly: true,
      position: 'sidebar',
    },
  },
  referredBy: {
    type: 'relationship',
    relationTo: 'users',
  },
  totalReferrals: {
    type: 'number',
    defaultValue: 0,
    admin: {
      readOnly: true,
    },
  },
}
```

## Frontend Components

### ReferralDashboard Component
A React component that displays referral statistics and allows users to copy their referral link.

**Usage:**
```tsx
import ReferralDashboard from '@/components/ReferralDashboard'

function UserProfile() {
  return (
    <div>
      <h1>User Profile</h1>
      <ReferralDashboard className="mt-6" />
    </div>
  )
}
```

**Features:**
- Displays total referrals, referral code, and rewards
- Copy-to-clipboard functionality for referral links
- List of recent referrals
- Loading and error states
- Responsive design with Tailwind CSS

## Utility Functions

The referral system includes utility functions in `@/utilities/referral`:

### `generateReferralLink(referralCode, baseUrl?)`
Generates a complete referral link.

### `parseReferralCookie(cookieValue)`
Parses referral data from a cookie value.

### `isReferralValid(timestamp)`
Checks if a referral timestamp is still valid (within 30 days).

### `extractReferralFromCookies(cookieHeader)`
Extracts and validates referral data from request cookies.

### `getReferralCookieOptions(isProduction?)`
Returns secure cookie options for setting referral cookies.

## Testing

The referral system includes comprehensive tests in `tests/int/api.int.spec.ts`:

- Unique referral code generation
- Referral tracking with valid cookies
- Expired cookie handling
- Utility function validation
- Cookie parsing and extraction

**Run tests:**
```bash
pnpm test:int
```

## Security Considerations

1. **HTTP-Only Cookies**: Referral cookies are not accessible via JavaScript, preventing XSS attacks
2. **Secure Flag**: Cookies are marked secure in production environments
3. **SameSite Protection**: Cookies use SameSite=lax to prevent CSRF attacks
4. **Expiration**: Cookies automatically expire after 30 days
5. **Validation**: All referral data is validated before processing
6. **Error Handling**: Referral errors don't prevent user registration

## Configuration

Environment variables:
- `NEXT_PUBLIC_SERVER_URL`: Base URL for generating referral links
- `NODE_ENV`: Determines cookie security settings

Constants (in `@/utilities/referral`):
- `COOKIE_NAME`: 'smartvision_referral'
- `COOKIE_MAX_AGE`: 30 days
- `REFERRAL_VALIDITY_DAYS`: 30 days

## Usage Examples

### Getting a User's Referral Link
```typescript
// Client-side
const response = await fetch('/api/custom/referral/generate')
const data = await response.json()
console.log(data.referralLink) // https://yoursite.com/api/custom/referral/redirect/1234567
```

### Checking Referral Statistics
```typescript
// Client-side
const response = await fetch('/api/custom/referral/stats')
const stats = await response.json()
console.log(`Total referrals: ${stats.totalReferrals}`)
```

### Manual Referral Link Generation
```typescript
// Server-side
import { generateReferralLink } from '@/utilities/referral'

const link = generateReferralLink('1234567')
console.log(link) // https://yoursite.com/api/custom/referral/redirect/1234567
```

## Troubleshooting

### Common Issues

1. **Referral not tracked**: Check if cookies are enabled and not blocked
2. **Invalid referral code**: Ensure the referral code exists in the database
3. **Expired referral**: Referral cookies expire after 30 days
4. **Duplicate referral codes**: The system prevents duplicates, but check for race conditions

### Debug Information

The system logs errors to the console:
- Referral processing errors during user creation
- Invalid referral code attempts
- Cookie parsing failures

### Testing Referrals Locally

1. Create a user account
2. Get the user's referral code from the admin panel
3. Visit `/api/custom/referral/redirect/{code}` in an incognito window
4. Register a new account
5. Check that the referral was tracked in the admin panel

## Future Enhancements

- Referral rewards system
- Multi-level referrals
- Referral analytics dashboard
- Email notifications for successful referrals
- Referral campaign management
- Social media sharing integration