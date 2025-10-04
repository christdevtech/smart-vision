# Notifications API

## Create Notifications by Role

### Endpoint

`POST /api/custom/notifications/create-by-role`

### Description

Creates notifications for all users with specified roles. Only admins, super-admins, and content managers can use this endpoint.

### Authentication

Requires valid authentication. Include authentication headers in your request.

### Permissions

- **super-admin**: Can send notifications to all roles
- **admin**: Can send notifications to admin, content-manager, support, and user roles
- **content-manager**: Can send notifications to content-manager, support, and user roles

### Request Body

```json
{
  "title": "Notification Title",
  "message": "Notification message content",
  "targetRoles": ["user", "support"],
  "type": "general",
  "priority": "normal",
  "actionLink": "/dashboard/subscription",
  "actionLabel": "View Details",
  "scheduledFor": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-30T23:59:59Z",
  "pushNotification": {
    "sendPush": true,
    "sound": "default",
    "badge": 1,
    "data": {
      "customField": "customValue"
    }
  },
  "metadata": {
    "relatedContentType": "videos",
    "relatedContentId": "video123",
    "source": "admin",
    "tags": ["announcement", "important"]
  }
}
```

### Required Fields

- `title` (string): Notification title (max 100 characters)
- `message` (string): Notification message (max 500 characters)
- `targetRoles` (array): Array of role strings to target

### Optional Fields

- `type` (string): Notification type (default: "general")
  - Options: system, payment, subscription, content, achievement, reminder, referral, study_plan, test_result, general
- `priority` (string): Priority level (default: "normal")
  - Options: low, normal, high, urgent
- `actionLink` (string): URL for user action
- `actionLabel` (string): Label for action button
- `scheduledFor` (string): ISO date for scheduled delivery
- `expiresAt` (string): ISO date when notification expires
- `pushNotification` (object): Push notification settings
- `metadata` (object): Additional metadata

### Valid Roles

- `super-admin`
- `admin`
- `content-manager`
- `support`
- `user`

### Response

#### Success (201 Created)

```json
{
  "success": true,
  "message": "Created 15 notifications for users with roles: user, support",
  "summary": {
    "totalTargetUsers": 15,
    "successfulNotifications": 15,
    "failedNotifications": 0,
    "targetRoles": ["user", "support"]
  },
  "createdNotifications": [
    {
      "notificationId": "notification123",
      "userId": "user456",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "userRole": "user"
    }
  ]
}
```

#### Partial Success (207 Multi-Status)

```json
{
  "success": true,
  "message": "Created 14 notifications for users with roles: user, support",
  "summary": {
    "totalTargetUsers": 15,
    "successfulNotifications": 14,
    "failedNotifications": 1,
    "targetRoles": ["user", "support"]
  },
  "createdNotifications": [...],
  "errors": [
    {
      "userId": "user789",
      "userEmail": "error@example.com",
      "error": "Validation failed"
    }
  ]
}
```

#### Error Responses

**401 Unauthorized**

```json
{
  "error": "Authentication required"
}
```

**403 Forbidden**

```json
{
  "error": "Insufficient permissions. Only admins and content managers can create notifications."
}
```

**400 Bad Request**

```json
{
  "error": "Missing required fields: title, message, and targetRoles (array)"
}
```

**404 Not Found**

```json
{
  "error": "No active users found with the specified roles"
}
```

## Get Notification Creation Info

### Endpoint

`GET /api/custom/notifications/create-by-role`

### Description

Returns information about available roles, permissions, and user counts for notification creation.

### Response

```json
{
  "userRole": "admin",
  "userRoleLevel": 4,
  "availableRoles": ["super-admin", "admin", "content-manager", "support", "user"],
  "accessibleTargetRoles": ["admin", "content-manager", "support", "user"],
  "roleHierarchy": {
    "super-admin": 5,
    "admin": 4,
    "content-manager": 3,
    "support": 2,
    "user": 1
  },
  "activeUserCounts": {
    "admin": 2,
    "content-manager": 5,
    "support": 3,
    "user": 150
  },
  "notificationTypes": [
    "system",
    "payment",
    "subscription",
    "content",
    "achievement",
    "reminder",
    "referral",
    "study_plan",
    "test_result",
    "general"
  ],
  "priorityLevels": ["low", "normal", "high", "urgent"]
}
```

## Usage Examples

### Send Announcement to All Users

```bash
curl -X POST /api/custom/notifications/create-by-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "System Maintenance",
    "message": "The system will be under maintenance from 2-4 AM tomorrow.",
    "targetRoles": ["user"],
    "type": "system",
    "priority": "high"
  }'
```

### Send Payment Reminder to Users

```bash
curl -X POST /api/custom/notifications/create-by-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Payment Due",
    "message": "Your subscription payment is due in 3 days.",
    "targetRoles": ["user"],
    "type": "payment",
    "priority": "normal",
    "actionLink": "/dashboard/subscription",
    "actionLabel": "Pay Now"
  }'
```

### Send Content Update to Staff

```bash
curl -X POST /api/custom/notifications/create-by-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "New Content Available",
    "message": "New study materials have been added to the platform.",
    "targetRoles": ["content-manager", "support"],
    "type": "content",
    "priority": "normal"
  }'
```
