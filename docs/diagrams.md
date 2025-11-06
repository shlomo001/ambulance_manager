# Ambulance Manager - System Diagrams

## 1. Ride Lifecycle Flow

```mermaid
flowchart TD
    A[Client Request] -->|Create Request| B[Pending Approval]
    B -->|Admin Approves| C[Assigned to Driver]
    B -->|Admin Rejects| D[Canceled]
    
    C -->|Driver Accepts| E[Accepted by Driver]
    C -->|Driver Declines| F[Notify Admin]
    F -->|Admin Reassigns| C
    
    E -->|Driver Starts| G[On the way]
    G -->|Driver Completes| H[Completed]
    G -->|Driver Cancels| I[Canceled]
    
    H -->|Auto Export| J[Google Sheets]
    H -->|Manual Export| J
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style D fill:#ffcdd2
    style I fill:#ffcdd2
    style J fill:#fff3e0
```

## 2. User Hierarchy & Permissions

```mermaid
flowchart TD
    A[Super Admin / CEO] -->|Full Control| B[Sub Admin / Deputy]
    A -->|Full Control| C[Admin / Manager]
    A -->|Full Control| D[Driver]
    A -->|Full Control| E[Institutional Client]
    
    B -->|Manage| C
    B -->|Manage| D
    B -->|Manage| E
    
    C -->|Manage| D
    C -->|Manage| E
    
    A -->|Custom Permissions| F[Flexible RBAC]
    B -->|Partial Permissions| F
    C -->|Limited Permissions| F
    
    style A fill:#ff9800
    style B fill:#2196f3
    style C fill:#4caf50
    style D fill:#9c27b0
    style E fill:#607d8b
    style F fill:#ffeb3b
```

## 3. System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React PWA]
        B[Service Worker]
        C[Push Notifications]
    end
    
    subgraph "API Gateway"
        D[Nginx Reverse Proxy]
        E[SSL/TLS]
        F[Rate Limiting]
    end
    
    subgraph "Backend Services"
        G[Express API]
        H[Authentication Service]
        I[Notification Service]
        J[Google Sheets Service]
    end
    
    subgraph "Data Layer"
        K[PostgreSQL]
        L[Redis Cache]
        M[File Storage]
    end
    
    subgraph "External Services"
        N[Google Sheets API]
        O[Firebase Cloud Messaging]
        P[Email Service]
    end
    
    A --> D
    B --> A
    C --> O
    
    D --> G
    E --> D
    F --> D
    
    G --> H
    G --> I
    G --> J
    
    H --> K
    I --> L
    J --> N
    
    G --> K
    G --> L
    G --> M
    
    I --> O
    I --> P
    
    style A fill:#61dafb
    style G fill:#68d391
    style K fill:#336791
    style N fill:#4285f4
```

## 4. Database Schema

```mermaid
erDiagram
    User ||--o{ Ride : creates
    User ||--o{ Ride : assigned_to
    User ||--o{ UserPermission : has
    User ||--o{ RefreshToken : owns
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : performs
    
    Ride ||--o{ Notification : generates
    Ride ||--o{ AuditLog : tracked
    
    User {
        string id PK
        string email UK
        string firstName
        string lastName
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Ride {
        string id PK
        string task
        string pickupAddress
        string dropoffAddress
        date scheduledDate
        time scheduledTime
        string clientId FK
        string driverId FK
        decimal estimatedFare
        string invoiceNumber
        text notes
        enum status
        datetime createdAt
        datetime updatedAt
    }
    
    UserPermission {
        string id PK
        string userId FK
        string permission
        boolean granted
        datetime createdAt
    }
    
    RefreshToken {
        string id PK
        string userId FK
        string token
        datetime expiresAt
        datetime createdAt
    }
    
    Notification {
        string id PK
        string userId FK
        string rideId FK
        string title
        text message
        enum type
        boolean isRead
        datetime createdAt
    }
    
    AuditLog {
        string id PK
        string userId FK
        string rideId FK
        string action
        json oldValues
        json newValues
        string ipAddress
        datetime createdAt
    }
```

## 5. Google Sheets Integration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google Sheets API
    participant DB as Database
    
    U->>F: Request Export
    F->>B: POST /api/sheets/export
    B->>DB: Query Rides
    DB-->>B: Return Rides Data
    
    B->>G: Authenticate
    G-->>B: Access Token
    
    B->>G: Check/Create Monthly Sheet
    G-->>B: Sheet Info
    
    B->>G: Export Data
    Note over B,G: Map Hebrew headers:<br/>date → תאריך<br/>task → משימה<br/>price → מחיר<br/>total → סה"כ
    
    G-->>B: Export Success
    B->>DB: Log Export History
    B-->>F: Export Complete
    F-->>U: Success Message
    
    Note over B,G: Auto-Sync for completed rides
    B->>G: Auto Export Completed Rides
    G-->>B: Auto Export Success
```

## 6. Notification System Flow

```mermaid
sequenceDiagram
    participant D as Driver
    participant A as Admin
    participant S as System
    participant N as Notification Service
    participant F as Firebase
    participant W as WebSocket
    
    A->>S: Assign Ride to Driver
    S->>N: Create Notification
    N->>F: Send Push Notification
    N->>W: Broadcast to Driver
    W-->>D: Real-time Notification
    
    D->>S: Accept/Decline Ride
    S->>N: Create Response Notification
    N->>F: Send Push to Admin
    N->>W: Broadcast to Admin
    W-->>A: Real-time Update
    
    Note over N,F: Notification Types:<br/>- RIDE_ASSIGNED<br/>- RIDE_ACCEPTED<br/>- RIDE_DECLINED<br/>- RIDE_COMPLETED<br/>- RIDE_CANCELLED
```

## 7. PWA Service Worker Flow

```mermaid
flowchart TD
    A[User Opens App] --> B{Online?}
    B -->|Yes| C[Load from Network]
    B -->|No| D[Load from Cache]
    
    C --> E[Update Cache]
    E --> F[Display Content]
    D --> F
    
    G[Background Sync] --> H[Queue Actions]
    H --> I{Network Available?}
    I -->|Yes| J[Sync with Server]
    I -->|No| K[Store in Queue]
    
    L[Push Notification] --> M[Show Notification]
    M --> N[User Interaction]
    N --> O[Open App]
    
    P[App Update] --> Q[New Version Available]
    Q --> R[Prompt User]
    R --> S[Install Update]
    
    style A fill:#e3f2fd
    style F fill:#c8e6c9
    style J fill:#c8e6c9
    style K fill:#ffecb3
    style S fill:#f3e5f5
```

## 8. Security & Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant D as Database
    participant R as Redis
    
    C->>A: Login Request
    A->>D: Validate Credentials
    D-->>A: User Data
    A->>A: Generate JWT & Refresh Token
    A->>R: Store Refresh Token
    A-->>C: Access & Refresh Tokens
    
    Note over C,A: Subsequent Requests
    C->>A: API Request with JWT
    A->>A: Validate JWT
    A-->>C: Protected Resource
    
    Note over C,A: Token Refresh
    C->>A: Refresh Token Request
    A->>R: Validate Refresh Token
    R-->>A: Token Valid
    A->>A: Generate New Tokens
    A-->>C: New Access & Refresh Tokens
    
    Note over C,A: Logout
    C->>A: Logout Request
    A->>R: Delete Refresh Token
    A-->>C: Logout Success
```

## 9. Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        A[Nginx]
    end
    
    subgraph "Application Layer"
        B[Frontend Container]
        C[Backend Container]
    end
    
    subgraph "Data Layer"
        D[PostgreSQL Container]
        E[Redis Container]
    end
    
    subgraph "Storage"
        F[Volume Mounts]
        G[Backup Storage]
    end
    
    subgraph "Monitoring"
        H[Health Checks]
        I[Log Aggregation]
        J[Performance Metrics]
    end
    
    A --> B
    A --> C
    C --> D
    C --> E
    D --> F
    E --> F
    F --> G
    
    H --> B
    H --> C
    H --> D
    H --> E
    
    I --> B
    I --> C
    I --> D
    I --> E
    
    J --> B
    J --> C
    
    style A fill:#ff5722
    style B fill:#2196f3
    style C fill:#4caf50
    style D fill:#9c27b0
    style E fill:#ff9800
```

## 10. Mobile-First UI Flow

```mermaid
flowchart TD
    A[Mobile App Launch] --> B{User Authenticated?}
    B -->|No| C[Login Screen]
    B -->|Yes| D[Dashboard]
    
    C --> E[Login Form]
    E --> F[Authentication]
    F --> D
    
    D --> G[Bottom Navigation]
    G --> H[Rides Tab]
    G --> I[Calendar Tab]
    G --> J[Notifications Tab]
    G --> K[Profile Tab]
    
    H --> L[Ride List]
    L --> M[Ride Details]
    M --> N[Update Status]
    
    I --> O[Calendar View]
    O --> P[Day/Week/Month]
    
    J --> Q[Notification List]
    Q --> R[Mark as Read]
    
    K --> S[User Profile]
    S --> T[Settings]
    S --> U[Logout]
    
    style A fill:#e1f5fe
    style D fill:#c8e6c9
    style G fill:#fff3e0
    style N fill:#f3e5f5
```

---

## Diagram Usage

### How to Use These Diagrams

1. **Ride Lifecycle**: Shows the complete flow of a ride from creation to completion
2. **User Hierarchy**: Displays the organizational structure and permission levels
3. **System Architecture**: Illustrates the technical architecture and component relationships
4. **Database Schema**: Shows the data model and relationships between entities
5. **Google Sheets Integration**: Details the export process and data mapping
6. **Notification System**: Explains how real-time notifications work
7. **PWA Service Worker**: Shows offline functionality and app updates
8. **Security Flow**: Details authentication and authorization processes
9. **Deployment Architecture**: Shows production deployment structure
10. **Mobile UI Flow**: Illustrates the mobile-first user experience

### Tools for Viewing

- **Mermaid Live Editor**: https://mermaid.live/
- **VS Code Extension**: Mermaid Preview
- **GitHub**: Native Mermaid support in markdown files
- **Documentation Sites**: Most support Mermaid rendering

### Customization

These diagrams can be customized by:
- Modifying the Mermaid syntax
- Adding new components or flows
- Updating colors and styling
- Adding new diagram types as needed
