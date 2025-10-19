# Quest Master iOS App - API Documentation

## Server Information

**Base URL:** `http://192.168.3.87:3001/api`

**Server IP:** `192.168.3.87`
**Port:** `3001`
**Authentication:** JWT Bearer Token
**Storage:** File-based (JSON files)

---

## Authentication Flow

### 1. Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - No 2FA):**
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

**Response (2FA Required):**
```json
{
  "requires2FA": true,
  "userId": "1"
}
```

### 2. 2FA Verification (if required)
**Endpoint:** `POST /api/auth/verify-2fa`

**Request Body:**
```json
{
  "userId": "1",
  "token": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## API Endpoints

### Protected Endpoints
All endpoints except `/api/auth/login` and `/api/auth/verify-2fa` require:

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## User Management

### Get User Profile
**GET** `/api/user/profile`

**Response:**
```json
{
  "id": "1",
  "username": "admin",
  "email": "admin@localhost",
  "level": 1,
  "xp": 0,
  "totalPoints": 0,
  "xpToNextLevel": 100,
  "twoFactorEnabled": false
}
```

### Update User Profile
**PATCH** `/api/user/profile`

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### Update User Stats
**PATCH** `/api/user/stats`

**Request Body:**
```json
{
  "level": 2,
  "xp": 150,
  "totalPoints": 500,
  "xpToNextLevel": 200
}
```

---

## Tasks

### Get All Tasks
**GET** `/api/tasks`

**Response:**
```json
[
  {
    "_id": "1697234567890",
    "userId": "1",
    "text": "Complete project proposal",
    "priority": "high",
    "category": "Work",
    "categoryColor": "#3b82f6",
    "icon": "💼",
    "completed": false,
    "progress": 50,
    "deadline": "2025-10-20T00:00:00.000Z",
    "blocksDevice": "playstation",
    "parentId": null,
    "recurring": false,
    "recurrenceType": null,
    "createdAt": "2025-10-15T10:00:00.000Z"
  }
]
```

### Create Task
**POST** `/api/tasks`

**Request Body:**
```json
{
  "text": "New task",
  "priority": "medium",
  "category": "Personal",
  "categoryColor": "#10b981",
  "icon": "🏠",
  "deadline": "2025-10-25T00:00:00.000Z",
  "progress": 0,
  "completed": false,
  "blocksDevice": null,
  "parentId": null,
  "recurring": false,
  "recurrenceType": null
}
```

**Response:** Returns the created task with `_id` and `createdAt`

### Update Task
**PATCH** `/api/tasks/:id`

**Request Body:** (Any fields to update)
```json
{
  "completed": true,
  "progress": 100
}
```

**Note:** If a task is marked as `completed: true` and has `recurring: true`, a new task with the next deadline will be automatically created.

### Delete Task
**DELETE** `/api/tasks/:id`

**Response:**
```json
{
  "message": "Task deleted"
}
```

---

## Categories

### Get All Categories
**GET** `/api/categories`

**Response:**
```json
[
  {
    "_id": "1",
    "userId": "1",
    "name": "Work",
    "color": "#3b82f6",
    "icon": "💼"
  }
]
```

### Create Category
**POST** `/api/categories`

**Request Body:**
```json
{
  "name": "Fitness",
  "color": "#ef4444",
  "icon": "🏋️"
}
```

### Update Category
**PATCH** `/api/categories/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "color": "#10b981",
  "icon": "🎯"
}
```

**Note:** If category name changes, all tasks using this category will be automatically updated.

### Delete Category
**DELETE** `/api/categories/:id`

---

## Routines

### Get All Routines
**GET** `/api/routines`

**Response:**
```json
[
  {
    "_id": "1697234567890",
    "userId": "1",
    "name": "Morning Routine",
    "icon": "☀️",
    "tasks": [
      {
        "text": "Brush teeth",
        "completed": false
      },
      {
        "text": "Make bed",
        "completed": true
      }
    ],
    "createdAt": "2025-10-15T10:00:00.000Z"
  }
]
```

### Create Routine
**POST** `/api/routines`

**Request Body:**
```json
{
  "name": "Evening Routine",
  "icon": "🌙",
  "tasks": [
    { "text": "Read book", "completed": false },
    { "text": "Meditate", "completed": false }
  ]
}
```

### Update Routine
**PATCH** `/api/routines/:id`

### Delete Routine
**DELETE** `/api/routines/:id`

### Complete Routine Task
**PATCH** `/api/routines/:id/complete/:taskIndex`

### Reset Routine
**PATCH** `/api/routines/:id/reset`

---

## Kanban Board

### Get All Columns
**GET** `/api/kanban/columns`

### Create Column
**POST** `/api/kanban/columns`

**Request Body:**
```json
{
  "name": "In Progress",
  "color": "#3b82f6",
  "order": 1
}
```

### Update Column
**PATCH** `/api/kanban/columns/:id`

### Delete Column
**DELETE** `/api/kanban/columns/:id`

**Note:** Tasks in deleted columns will have their `kanbanColumnId` set to `null`

---

## Device Blocking (Home Assistant Integration)

### Block Devices
**POST** `/api/block-devices`

**Request Body:**
```json
{
  "devices": ["playstation", "xbox", "tv"]
}
```

**Available Devices:**
- `playstation`
- `xbox`
- `tv`
- `computer`
- `tablet`

### Unblock Device
**POST** `/api/unblock-device`

**Request Body:**
```json
{
  "device": "playstation"
}
```

---

## Admin Endpoints (Requires `isAdmin: true`)

### Get All Users
**GET** `/api/admin/users`

### Create User
**POST** `/api/admin/users`

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "isAdmin": false
}
```

### Delete User
**DELETE** `/api/admin/users/:userId`

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```
or
```json
{
  "error": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "error": "Task not found"
}
```

**500 Server Error:**
```json
{
  "error": "Server error"
}
```

---

## Important Notes for iOS Development

### 1. **Network Configuration**
- Server listens on `0.0.0.0:3001` (accepts external connections)
- Make sure your iOS device is on the same network (`192.168.3.x`)
- For local development/simulator, you may need to use the actual server IP

### 2. **App Transport Security (ATS)**
Since the server uses HTTP (not HTTPS), you need to add this to your `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- OR for specific domain -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.3.87</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 3. **JWT Token Storage**
- Store JWT token securely using **Keychain** (not UserDefaults)
- Token expires in 30 days
- Include in all API requests: `Authorization: Bearer <token>`

### 4. **Recommended Swift Libraries**
- **Alamofire** - Networking
- **KeychainAccess** - Secure token storage
- **SwiftyJSON** or **Codable** - JSON parsing

### 5. **Data Models**
Use Codable structs matching the API responses:

```swift
struct User: Codable {
    let id: String
    let username: String
    let email: String
    let level: Int
    let xp: Int
    let totalPoints: Int
    let xpToNextLevel: Int
    let twoFactorEnabled: Bool
}

struct Task: Codable {
    let _id: String
    let userId: String
    let text: String
    let priority: String
    let category: String
    let categoryColor: String
    let icon: String
    var completed: Bool
    var progress: Int
    let deadline: String?
    let blocksDevice: String?
    let parentId: String?
    let recurring: Bool
    let recurrenceType: String?
    let createdAt: String
}

struct LoginResponse: Codable {
    let token: String?
    let user: User?
    let requires2FA: Bool?
    let userId: String?
}
```

### 6. **API Service Example**

```swift
class APIService {
    static let shared = APIService()
    private let baseURL = "http://192.168.3.87:3001/api"

    func login(username: String, password: String, completion: @escaping (Result<LoginResponse, Error>) -> Void) {
        let url = "\(baseURL)/auth/login"
        let parameters = ["username": username, "password": password]

        AF.request(url, method: .post, parameters: parameters, encoding: JSONEncoding.default)
            .responseDecodable(of: LoginResponse.self) { response in
                switch response.result {
                case .success(let loginResponse):
                    completion(.success(loginResponse))
                case .failure(let error):
                    completion(.failure(error))
                }
            }
    }

    func getTasks(token: String, completion: @escaping (Result<[Task], Error>) -> Void) {
        let url = "\(baseURL)/tasks"
        let headers: HTTPHeaders = ["Authorization": "Bearer \(token)"]

        AF.request(url, headers: headers)
            .responseDecodable(of: [Task].self) { response in
                switch response.result {
                case .success(let tasks):
                    completion(.success(tasks))
                case .failure(let error):
                    completion(.failure(error))
                }
            }
    }
}
```

### 7. **Offline Support Recommendations**
- Cache data locally using Core Data or Realm
- Queue API requests when offline
- Sync when connection is restored
- Use background fetch for periodic sync

### 8. **Push Notifications**
Currently not implemented in the backend. To add:
- Store device tokens in backend
- Send notifications when tasks are due
- Use APNs (Apple Push Notification service)

### 9. **Real-time Updates**
Backend doesn't currently support WebSockets. Options:
- **Polling**: Fetch tasks every 30-60 seconds
- **Add Socket.IO**: Implement real-time sync (requires backend changes)

### 10. **Testing**
Test credentials:
- **Username:** `admin`
- **Password:** `admin123`

Health check endpoint:
```
GET http://192.168.3.87:3001/health
```

---

## Firewall Configuration

The server requires port **3001** to be open. If connection fails, check firewall:

```bash
# On server, check if port is open
sudo ufw status
sudo ufw allow 3001/tcp
```

---

## Contact & Support

Server Location: `/home/admin/quest-master/server/server.js`
Data Storage: `/home/admin/quest-master/server/data/`

For backend issues, check server logs or restart the service.
