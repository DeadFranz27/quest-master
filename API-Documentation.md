# Quest Master API Documentation

Complete REST API documentation for Quest Master backend access.

**Base URL:** `http://<server-ip>:3001`
**Default Port:** 3001

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Tasks](#tasks)
4. [Categories](#categories)
5. [Routines](#routines)
6. [Kanban Board](#kanban-board)
7. [Device Control (Home Assistant)](#device-control)
8. [Admin Operations](#admin-operations)
9. [System Updates](#system-updates)
10. [Error Handling](#error-handling)

---

## Authentication

### Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@localhost",
    "isAdmin": true,
    "level": 1,
    "xp": 0,
    "totalPoints": 0,
    "xpToNextLevel": 100,
    "twoFactorEnabled": false
  }
}
```

**2FA Required Response (200):**
```json
{
  "requires2FA": true,
  "userId": "1"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### Verify 2FA
Complete login with two-factor authentication code.

**Endpoint:** `POST /api/auth/verify-2fa`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "1",
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@localhost",
    "isAdmin": true,
    "level": 1,
    "xp": 0,
    "totalPoints": 0,
    "xpToNextLevel": 100,
    "twoFactorEnabled": true
  }
}
```

---

## User Management

All user endpoints require authentication via JWT token in the Authorization header.

**Authentication Header:**
```
Authorization: Bearer <token>
```

### Get User Profile
Retrieve current user's profile information.

**Endpoint:** `GET /api/user/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@localhost",
  "isAdmin": true,
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "twoFactorEnabled": false,
  "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." || null,
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

---

### Update User Profile
Update username, email, password, or profile picture.

**Endpoint:** `PATCH /api/user/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Notes:**
- All fields are optional
- `currentPassword` is required only when changing password
- Password must be provided with `newPassword` to change it
- `profilePicture` accepts base64-encoded image data (JPEG/PNG)
- Set `profilePicture` to `null` to remove the profile picture
- Images are automatically compressed on the client side (max 400x400px, 80% JPEG quality)
- Maximum payload size: 10MB

**Success Response (200):**
```json
{
  "id": "1",
  "username": "newusername",
  "email": "newemail@example.com",
  "isAdmin": true,
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "twoFactorEnabled": false,
  "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

### Update User Stats
Update user gamification stats (level, XP, points).

**Endpoint:** `PATCH /api/user/stats`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "level": 2,
  "xp": 150,
  "totalPoints": 250,
  "xpToNextLevel": 300
}
```

**Success Response (200):**
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@localhost",
  "isAdmin": true,
  "level": 2,
  "xp": 150,
  "totalPoints": 250,
  "xpToNextLevel": 300,
  "twoFactorEnabled": false
}
```

---

### Setup Two-Factor Authentication
Generate 2FA secret and QR code for authenticator app.

**Endpoint:** `POST /api/user/2fa/setup`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Notes:**
- QR code is a base64-encoded PNG image
- Secret is base32-encoded for manual entry

---

### Enable Two-Factor Authentication
Verify 2FA setup and enable it for the account.

**Endpoint:** `POST /api/user/2fa/enable`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@localhost",
  "isAdmin": true,
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "twoFactorEnabled": true
}
```

---

### Disable Two-Factor Authentication
Disable 2FA after password verification.

**Endpoint:** `POST /api/user/2fa/disable`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@localhost",
  "isAdmin": true,
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "twoFactorEnabled": false
}
```

---

## Tasks

### Get All Tasks
Retrieve all tasks for the authenticated user.

**Endpoint:** `GET /api/tasks`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "_id": "1697123456789",
    "userId": "1",
    "text": "Complete project documentation",
    "priority": "high",
    "icon": "📝",
    "category": "Work",
    "categoryColor": "#3b82f6",
    "deadline": "2025-10-20T00:00:00.000Z",
    "recurring": false,
    "recurrenceType": null,
    "progress": 0,
    "completed": false,
    "parentId": null,
    "kanbanColumnId": null,
    "notes": "",
    "estimatedTime": 120,
    "actualTime": 0,
    "tags": ["documentation", "urgent"],
    "progressTracking": {
      "type": "numeric",
      "current": 0,
      "target": 100
    },
    "createdAt": "2025-10-15T10:00:00.000Z"
  }
]
```

---

### Create Task
Create a new task for the authenticated user.

**Endpoint:** `POST /api/tasks`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Complete project documentation",
  "priority": "high",
  "icon": "📝",
  "category": "Work",
  "categoryColor": "#3b82f6",
  "deadline": "2025-10-20T00:00:00.000Z",
  "recurring": false,
  "recurrenceType": null,
  "progress": 0,
  "completed": false,
  "parentId": null,
  "kanbanColumnId": null,
  "notes": "",
  "estimatedTime": 120,
  "actualTime": 0,
  "tags": ["documentation", "urgent"],
  "progressTracking": {
    "type": "numeric",
    "current": 0,
    "target": 100
  }
}
```

**Field Descriptions:**
- `text` (required): Task title/description
- `priority` (optional): "low", "medium", or "high"
- `icon` (optional): Emoji icon for the task
- `category` (optional): Category name
- `categoryColor` (optional): Hex color code for category
- `deadline` (optional): ISO 8601 date string
- `recurring` (optional): Boolean for recurring tasks
- `recurrenceType` (optional): "daily", "weekly", "monthly", or "yearly"
- `progress` (optional): Progress percentage (0-100)
- `completed` (optional): Boolean completion status
- `parentId` (optional): ID of parent task for subtasks
- `kanbanColumnId` (optional): Kanban column assignment
- `notes` (optional): Additional task notes
- `estimatedTime` (optional): Estimated time in minutes
- `actualTime` (optional): Actual time spent in minutes
- `tags` (optional): Array of tag strings
- `progressTracking` (optional): Object with type, current, and target values

**Success Response (201):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "text": "Complete project documentation",
  "priority": "high",
  "icon": "📝",
  "category": "Work",
  "categoryColor": "#3b82f6",
  "deadline": "2025-10-20T00:00:00.000Z",
  "recurring": false,
  "recurrenceType": null,
  "progress": 0,
  "completed": false,
  "parentId": null,
  "kanbanColumnId": null,
  "notes": "",
  "estimatedTime": 120,
  "actualTime": 0,
  "tags": ["documentation", "urgent"],
  "progressTracking": {
    "type": "numeric",
    "current": 0,
    "target": 100
  },
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

---

### Update Task
Update an existing task.

**Endpoint:** `PATCH /api/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Task ID

**Request Body:**
```json
{
  "completed": true,
  "progress": 100,
  "actualTime": 90
}
```

**Notes:**
- Send only the fields you want to update
- Supports nested field updates like `"progressTracking.current": 50`
- If a recurring task is marked complete, a new occurrence is automatically created

**Success Response (200):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "text": "Complete project documentation",
  "priority": "high",
  "icon": "📝",
  "category": "Work",
  "categoryColor": "#3b82f6",
  "deadline": "2025-10-20T00:00:00.000Z",
  "recurring": false,
  "recurrenceType": null,
  "progress": 100,
  "completed": true,
  "actualTime": 90,
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

---

### Delete Task
Delete a task permanently.

**Endpoint:** `DELETE /api/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Task ID

**Success Response (200):**
```json
{
  "message": "Task deleted"
}
```

---

## Categories

### Get All Categories
Retrieve all categories for the authenticated user.

**Endpoint:** `GET /api/categories`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "_id": "1",
    "userId": "1",
    "name": "Work",
    "color": "#3b82f6",
    "icon": "💼"
  },
  {
    "_id": "2",
    "userId": "1",
    "name": "Personal",
    "color": "#10b981",
    "icon": "🏠"
  }
]
```

---

### Create Category
Create a new category.

**Endpoint:** `POST /api/categories`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Health",
  "color": "#ef4444",
  "icon": "❤️"
}
```

**Success Response (201):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Health",
  "color": "#ef4444",
  "icon": "❤️"
}
```

---

### Update Category
Update an existing category.

**Endpoint:** `PATCH /api/categories/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Category ID

**Request Body:**
```json
{
  "name": "Health & Fitness",
  "color": "#f59e0b"
}
```

**Notes:**
- When category name is updated, all tasks using this category are automatically updated

**Success Response (200):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Health & Fitness",
  "color": "#f59e0b",
  "icon": "❤️"
}
```

---

### Delete Category
Delete a category permanently.

**Endpoint:** `DELETE /api/categories/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Category ID

**Success Response (200):**
```json
{
  "message": "Category deleted"
}
```

---

## Routines

Routines are collections of tasks that can be completed together as a checklist.

### Get All Routines
Retrieve all routines for the authenticated user.

**Endpoint:** `GET /api/routines`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "_id": "1697123456789",
    "userId": "1",
    "name": "Morning Routine",
    "icon": "☀️",
    "color": "#f59e0b",
    "tasks": [
      {
        "text": "Brush teeth",
        "completed": false
      },
      {
        "text": "Exercise for 30 minutes",
        "completed": false
      },
      {
        "text": "Have breakfast",
        "completed": false
      }
    ],
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
]
```

---

### Create Routine
Create a new routine.

**Endpoint:** `POST /api/routines`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Evening Routine",
  "icon": "🌙",
  "color": "#6366f1",
  "tasks": [
    {
      "text": "Review daily tasks",
      "completed": false
    },
    {
      "text": "Read for 20 minutes",
      "completed": false
    }
  ]
}
```

**Success Response (201):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Evening Routine",
  "icon": "🌙",
  "color": "#6366f1",
  "tasks": [
    {
      "text": "Review daily tasks",
      "completed": false
    },
    {
      "text": "Read for 20 minutes",
      "completed": false
    }
  ],
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

---

### Update Routine
Update an existing routine.

**Endpoint:** `PATCH /api/routines/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Routine ID

**Request Body:**
```json
{
  "name": "Updated Evening Routine",
  "tasks": [
    {
      "text": "Review daily tasks",
      "completed": false
    },
    {
      "text": "Read for 30 minutes",
      "completed": false
    },
    {
      "text": "Meditate",
      "completed": false
    }
  ]
}
```

**Success Response (200):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Updated Evening Routine",
  "icon": "🌙",
  "color": "#6366f1",
  "tasks": [
    {
      "text": "Review daily tasks",
      "completed": false
    },
    {
      "text": "Read for 30 minutes",
      "completed": false
    },
    {
      "text": "Meditate",
      "completed": false
    }
  ],
  "createdAt": "2025-10-15T10:00:00.000Z",
  "updatedAt": "2025-10-15T12:00:00.000Z"
}
```

---

### Delete Routine
Delete a routine permanently.

**Endpoint:** `DELETE /api/routines/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Routine ID

**Success Response (200):**
```json
{
  "message": "Routine deleted"
}
```

---

### Complete Routine Task
Mark a specific task within a routine as completed.

**Endpoint:** `PATCH /api/routines/:id/complete/:taskIndex`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Routine ID
- `taskIndex`: Zero-based index of the task in the tasks array

**Success Response (200):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Morning Routine",
  "icon": "☀️",
  "color": "#f59e0b",
  "tasks": [
    {
      "text": "Brush teeth",
      "completed": true
    },
    {
      "text": "Exercise for 30 minutes",
      "completed": false
    }
  ],
  "updatedAt": "2025-10-15T12:00:00.000Z"
}
```

---

### Reset Routine
Mark all tasks in a routine as incomplete.

**Endpoint:** `PATCH /api/routines/:id/reset`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Routine ID

**Success Response (200):**
```json
{
  "_id": "1697123456789",
  "userId": "1",
  "name": "Morning Routine",
  "icon": "☀️",
  "color": "#f59e0b",
  "tasks": [
    {
      "text": "Brush teeth",
      "completed": false
    },
    {
      "text": "Exercise for 30 minutes",
      "completed": false
    }
  ],
  "updatedAt": "2025-10-15T12:00:00.000Z"
}
```

---

## Kanban Board

Organize tasks in customizable Kanban columns.

### Get All Columns
Retrieve all Kanban columns for the authenticated user.

**Endpoint:** `GET /api/kanban/columns`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "_id": "1697123456789",
    "userId": "1",
    "name": "To Do",
    "color": "#6366f1",
    "order": 0,
    "createdAt": "2025-10-15T10:00:00.000Z"
  },
  {
    "_id": "1697123456790",
    "userId": "1",
    "name": "In Progress",
    "color": "#f59e0b",
    "order": 1,
    "createdAt": "2025-10-15T10:00:00.000Z"
  },
  {
    "_id": "1697123456791",
    "userId": "1",
    "name": "Done",
    "color": "#10b981",
    "order": 2,
    "createdAt": "2025-10-15T10:00:00.000Z"
  }
]
```

---

### Create Column
Create a new Kanban column.

**Endpoint:** `POST /api/kanban/columns`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Review",
  "color": "#8b5cf6",
  "order": 2
}
```

**Field Descriptions:**
- `name` (required): Column name
- `color` (required): Hex color code
- `order` (optional): Display order (defaults to end of list)

**Success Response (201):**
```json
{
  "_id": "1697123456792",
  "userId": "1",
  "name": "Review",
  "color": "#8b5cf6",
  "order": 2,
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

---

### Update Column
Update an existing Kanban column.

**Endpoint:** `PATCH /api/kanban/columns/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id`: Column ID

**Request Body:**
```json
{
  "name": "Under Review",
  "color": "#a855f7",
  "order": 3
}
```

**Success Response (200):**
```json
{
  "_id": "1697123456792",
  "userId": "1",
  "name": "Under Review",
  "color": "#a855f7",
  "order": 3,
  "createdAt": "2025-10-15T10:00:00.000Z",
  "updatedAt": "2025-10-15T12:00:00.000Z"
}
```

---

### Delete Column
Delete a Kanban column permanently.

**Endpoint:** `DELETE /api/kanban/columns/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Column ID

**Notes:**
- Tasks assigned to this column will have their `kanbanColumnId` set to `null`
- Tasks are not deleted, only unassigned from the column

**Success Response (200):**
```json
{
  "message": "Column deleted"
}
```

---

### Assign Task to Column
To assign a task to a Kanban column, update the task with the `kanbanColumnId` field:

**Endpoint:** `PATCH /api/tasks/:id`

**Request Body:**
```json
{
  "kanbanColumnId": "1697123456789"
}
```

See [Update Task](#update-task) for full details.

---

## Device Control

Control smart home devices via Home Assistant integration.

### Block Devices
Turn off multiple devices (typically used as a productivity feature).

**Endpoint:** `POST /api/block-devices`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "devices": ["playstation", "xbox", "tv", "computer", "tablet"]
}
```

**Available Devices:**
- `playstation` → Home Assistant entity: `switch.playstation`
- `xbox` → Home Assistant entity: `switch.xbox`
- `tv` → Home Assistant entity: `switch.tv`
- `computer` → Home Assistant entity: `switch.computer`
- `tablet` → Home Assistant entity: `switch.tablet`

**Success Response (200):**
```json
{
  "message": "Devices blocked",
  "results": [
    {
      "device": "playstation",
      "entityId": "switch.playstation",
      "success": true,
      "data": {}
    },
    {
      "device": "xbox",
      "entityId": "switch.xbox",
      "success": true,
      "data": {}
    }
  ]
}
```

**Notes:**
- Requires Home Assistant URL and access token configured in server `.env` file
- Calls Home Assistant `switch/turn_off` service for each device

---

### Unblock Device
Turn on a previously blocked device.

**Endpoint:** `POST /api/unblock-device`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "device": "playstation"
}
```

**Success Response (200):**
```json
{
  "message": "Device unblocked",
  "device": "playstation",
  "entityId": "switch.playstation",
  "success": true,
  "data": {}
}
```

**Notes:**
- Calls Home Assistant `switch/turn_on` service for the device

---

## Admin Operations

Admin endpoints require the user to have `isAdmin: true` in their profile.

### Get All Users
Retrieve all users in the system (admin only).

**Endpoint:** `GET /api/admin/users`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "id": "1",
    "username": "admin",
    "email": "admin@localhost",
    "isAdmin": true,
    "level": 1,
    "xp": 0,
    "totalPoints": 0,
    "xpToNextLevel": 100,
    "twoFactorEnabled": false,
    "createdAt": "2025-10-15T10:00:00.000Z"
  },
  {
    "id": "2",
    "username": "user1",
    "email": "user1@localhost",
    "isAdmin": false,
    "level": 3,
    "xp": 250,
    "totalPoints": 750,
    "xpToNextLevel": 400,
    "twoFactorEnabled": false,
    "createdAt": "2025-10-14T10:00:00.000Z"
  }
]
```

---

### Create User
Create a new user account (admin only).

**Endpoint:** `POST /api/admin/users`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "isAdmin": false
}
```

**Field Descriptions:**
- `username` (required): Unique username
- `password` (required): User password (will be hashed)
- `email` (optional): User email address
- `isAdmin` (optional): Admin privileges (default: false)

**Success Response (201):**
```json
{
  "id": "1697123456789",
  "username": "newuser",
  "email": "newuser@example.com",
  "isAdmin": false,
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "createdAt": "2025-10-15T10:00:00.000Z"
}
```

**Error Response (400):**
```json
{
  "message": "Username already exists"
}
```

---

### Delete User
Delete a user account (admin only).

**Endpoint:** `DELETE /api/admin/users/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `userId`: User ID to delete

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response (400):**
```json
{
  "message": "Cannot delete your own account"
}
```

**Notes:**
- Admins cannot delete their own account
- User's tasks, categories, and routines remain in the database

---

## System Updates

Manage system updates via Git (admin only).

### Check for Updates
Check if updates are available from the Git repository.

**Endpoint:** `GET /api/update/check`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "hasUpdates": true,
  "currentHash": "a1b2c3d",
  "remoteHash": "e4f5g6h",
  "changelog": [
    {
      "hash": "e4f5g6h",
      "author": "Developer Name",
      "date": "2 hours ago",
      "message": "Add new feature X"
    },
    {
      "hash": "i7j8k9l",
      "author": "Developer Name",
      "date": "5 hours ago",
      "message": "Fix bug in component Y"
    }
  ],
  "lastChecked": "2025-10-15T12:00:00.000Z"
}
```

**No Updates Response (200):**
```json
{
  "hasUpdates": false,
  "currentHash": "a1b2c3d",
  "remoteHash": "a1b2c3d",
  "changelog": [],
  "lastChecked": "2025-10-15T12:00:00.000Z"
}
```

---

### Apply Update
Apply pending updates from the Git repository.

**Endpoint:** `POST /api/update/apply`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Update started",
  "logId": "1697123456789"
}
```

**Notes:**
- Update runs in the background
- Process includes: backup, git pull, npm install (backend & frontend), service restart
- Check update status using the log ID

---

### Get Update Status
Get update configuration and recent update logs.

**Endpoint:** `GET /api/update/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "config": {
    "autoCheck": true,
    "repositoryUrl": "",
    "branch": "main",
    "lastChecked": "2025-10-15T12:00:00.000Z",
    "currentVersion": "1.0.0"
  },
  "recentLogs": [
    {
      "id": "1697123456789",
      "startedAt": "2025-10-15T11:00:00.000Z",
      "completedAt": "2025-10-15T11:05:00.000Z",
      "status": "completed",
      "steps": [
        {
          "step": "backup",
          "status": "success",
          "timestamp": "2025-10-15T11:00:30.000Z"
        },
        {
          "step": "git-pull",
          "status": "success",
          "output": "Already up to date.",
          "timestamp": "2025-10-15T11:01:00.000Z"
        }
      ]
    }
  ]
}
```

---

### Update Configuration
Update system update settings.

**Endpoint:** `POST /api/update/config`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "autoCheck": true,
  "repositoryUrl": "https://github.com/username/quest-master",
  "branch": "main"
}
```

**Success Response (200):**
```json
{
  "message": "Configuration updated",
  "config": {
    "autoCheck": true,
    "repositoryUrl": "https://github.com/username/quest-master",
    "branch": "main",
    "lastChecked": "2025-10-15T12:00:00.000Z",
    "currentVersion": "1.0.0"
  }
}
```

---

## Health Check

Check if the API server is running.

**Endpoint:** `GET /health`

**No authentication required**

**Success Response (200):**
```json
{
  "status": "ok",
  "storage": "file-based"
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Or:

```json
{
  "message": "Error message description"
}
```

### HTTP Status Codes

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 500 | Internal server error |

### Common Error Scenarios

#### Authentication Errors

**Missing Token:**
```json
{
  "error": "No token provided"
}
```

**Invalid Token:**
```json
{
  "error": "Invalid token"
}
```

**Invalid Credentials:**
```json
{
  "error": "Invalid credentials"
}
```

#### Authorization Errors

**Admin Access Required:**
```json
{
  "error": "Admin access required"
}
```

#### Validation Errors

**Missing Required Fields:**
```json
{
  "error": "Username and password are required"
}
```

**Invalid Data:**
```json
{
  "message": "Current password is required"
}
```

#### Resource Not Found

```json
{
  "error": "Task not found"
}
```

```json
{
  "error": "User not found"
}
```

---

## Environment Configuration

Server configuration is managed via `.env` file in the `server/` directory:

```bash
# Server Port
PORT=3001

# JWT Secret (change in production)
JWT_SECRET=your-secret-key-change-this-in-production

# Home Assistant Integration
HA_URL=http://homeassistant.local:8123
HA_TOKEN=YOUR_LONG_LIVED_ACCESS_TOKEN
```

---

## Data Storage

Quest Master uses file-based JSON storage in `server/data/`:

- `users.json` - User accounts
- `tasks.json` - Tasks
- `categories.json` - Categories
- `routines.json` - Routines
- `kanban-columns.json` - Kanban columns
- `update-log.json` - Update history
- `update-config.json` - Update configuration

**Default User:**
- Username: `admin`
- Password: `admin123`

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting middleware.

---

## CORS Configuration

CORS is enabled for all origins. Modify `server/server.js` to restrict origins in production:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

---

## Example API Usage

### Complete Workflow Example

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: { "token": "eyJhbGc...", "user": {...} }

# 2. Get all tasks
curl http://localhost:3001/api/tasks \
  -H "Authorization: Bearer eyJhbGc..."

# 3. Create a task
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "text": "New task",
    "priority": "high",
    "category": "Work",
    "deadline": "2025-10-20T00:00:00.000Z"
  }'

# 4. Update task
curl -X PATCH http://localhost:3001/api/tasks/1697123456789 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"completed": true, "progress": 100}'

# 5. Delete task
curl -X DELETE http://localhost:3001/api/tasks/1697123456789 \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## JavaScript/Node.js Example

```javascript
const API_URL = 'http://localhost:3001';
let token = '';

// Login
async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const data = await response.json();
  token = data.token;
  return data;
}

// Get tasks
async function getTasks() {
  const response = await fetch(`${API_URL}/api/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
}

// Create task
async function createTask(taskData) {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  return await response.json();
}

// Update task
async function updateTask(taskId, updates) {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  return await response.json();
}

// Delete task
async function deleteTask(taskId) {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
}

// Usage
(async () => {
  await login();
  const tasks = await getTasks();
  console.log('Tasks:', tasks);

  const newTask = await createTask({
    text: 'Complete API documentation',
    priority: 'high',
    category: 'Work'
  });
  console.log('Created task:', newTask);
})();
```

---

## Python Example

```python
import requests
import json

API_URL = 'http://localhost:3001'
token = ''

def login(username, password):
    global token
    response = requests.post(
        f'{API_URL}/api/auth/login',
        json={'username': username, 'password': password}
    )
    data = response.json()
    token = data['token']
    return data

def get_tasks():
    response = requests.get(
        f'{API_URL}/api/tasks',
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()

def create_task(task_data):
    response = requests.post(
        f'{API_URL}/api/tasks',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=task_data
    )
    return response.json()

def update_task(task_id, updates):
    response = requests.patch(
        f'{API_URL}/api/tasks/{task_id}',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=updates
    )
    return response.json()

def delete_task(task_id):
    response = requests.delete(
        f'{API_URL}/api/tasks/{task_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()

# Usage
if __name__ == '__main__':
    login('admin', 'admin123')

    tasks = get_tasks()
    print('Tasks:', json.dumps(tasks, indent=2))

    new_task = create_task({
        'text': 'Complete API documentation',
        'priority': 'high',
        'category': 'Work'
    })
    print('Created task:', json.dumps(new_task, indent=2))
```

---

## Security Best Practices

1. **Change Default Credentials**: Immediately change the default admin password
2. **Use HTTPS**: Deploy behind a reverse proxy with SSL/TLS
3. **Strong JWT Secret**: Use a long, random string for `JWT_SECRET`
4. **Enable 2FA**: Use two-factor authentication for admin accounts
5. **Secure Home Assistant Token**: Keep the HA access token confidential
6. **Regular Backups**: Backup the `server/data/` directory regularly
7. **Update Regularly**: Keep the system updated via the update endpoints
8. **Network Security**: Use firewall rules to restrict access to the API port

---

## API Changelog

### Version 1.0.0 (Current)
- Initial API release
- User authentication with JWT
- Two-factor authentication support
- Task management (CRUD)
- Category management (CRUD)
- Routine management (CRUD)
- Kanban board columns (CRUD)
- Device control via Home Assistant
- Admin user management
- System update management
- Gamification (XP, levels, points)

---

## Support & Troubleshooting

### Common Issues

**1. Cannot connect to API**
- Verify server is running: `systemctl status quest-master-backend`
- Check firewall rules: Port 3001 should be accessible
- Verify network address in API_URL

**2. Authentication fails**
- Check username and password
- Verify JWT_SECRET is consistent
- Check token expiration (30 days)

**3. Home Assistant integration not working**
- Verify HA_URL in `.env`
- Check HA_TOKEN is valid
- Ensure Home Assistant is accessible from the server
- Verify switch entity IDs in DEVICE_ENTITY_MAP

**4. 401 Unauthorized errors**
- Token may be expired (30-day expiration)
- Re-login to get a new token
- Verify Authorization header format: `Bearer <token>`

---

## API Endpoint Summary

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-2fa` - Verify 2FA

### User Management
- `GET /api/user/profile` - Get profile
- `PATCH /api/user/profile` - Update profile
- `PATCH /api/user/stats` - Update stats
- `POST /api/user/2fa/setup` - Setup 2FA
- `POST /api/user/2fa/enable` - Enable 2FA
- `POST /api/user/2fa/disable` - Disable 2FA

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Routines
- `GET /api/routines` - Get all routines
- `POST /api/routines` - Create routine
- `PATCH /api/routines/:id` - Update routine
- `DELETE /api/routines/:id` - Delete routine
- `PATCH /api/routines/:id/complete/:taskIndex` - Complete task
- `PATCH /api/routines/:id/reset` - Reset routine

### Kanban
- `GET /api/kanban/columns` - Get columns
- `POST /api/kanban/columns` - Create column
- `PATCH /api/kanban/columns/:id` - Update column
- `DELETE /api/kanban/columns/:id` - Delete column

### Device Control
- `POST /api/block-devices` - Block devices
- `POST /api/unblock-device` - Unblock device

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:userId` - Delete user

### System
- `GET /api/update/check` - Check for updates
- `POST /api/update/apply` - Apply updates
- `GET /api/update/status` - Get update status
- `POST /api/update/config` - Update config
- `GET /health` - Health check

---

**Quest Master API Documentation v1.0.0**
*Last Updated: October 15, 2025*
