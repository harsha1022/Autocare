# 🚗 CarCare — On-Demand Car Assistance Platform

CarCare is a full-stack web application that connects car owners with nearby mechanics for real-time roadside assistance and service booking. It features live location tracking, in-app chat, role-based dashboards, and an admin management panel.

---

## ✨ Features

### 👤 Users
- Browse available car services
- Book roadside assistance with location selection via an interactive map
- Track mechanic location in real-time
- Chat with assigned mechanic via in-app messaging
- View and manage booking history
- Rate completed service requests

### 🔧 Mechanics
- Receive and manage incoming service requests
- Accept/reject or complete jobs from a dedicated dashboard
- Share live GPS location with the customer during a job
- Communicate with customers via in-app chat

### 🛠️ Admins
- Full user and mechanic management
- Monitor all service requests and their statuses
- View platform-wide analytics and charts
- Manage mechanic approvals and assignments

---

## 🏗️ Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework & build tool |
| React Router v7 | Client-side routing |
| Socket.IO Client | Real-time chat & location tracking |
| React Leaflet + Leaflet | Interactive maps & map picker |
| Recharts | Admin analytics charts |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |
| TailwindCSS | Utility-first styling |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.IO | Real-time WebSocket server |
| JSON Web Tokens (JWT) | Authentication & authorization |
| bcryptjs | Password hashing |
| Zod | Request validation |
| dotenv | Environment configuration |
| nodemon | Development auto-restart |

---

## 📁 Project Structure

```
carcare/
├── client/                     # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx         # In-app real-time chat
│   │   │   ├── LiveTrackingMap.jsx # Real-time mechanic location map
│   │   │   ├── MapPicker.jsx       # Interactive location picker
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── ProtectedRoute.jsx  # Role-based route guard
│   │   │   └── RatingWidget.jsx    # Service rating component
│   │   ├── context/                # React context providers
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page / user dashboard
│   │   │   ├── Services.jsx        # Service catalog
│   │   │   ├── Booking.jsx         # Book a service
│   │   │   ├── Auth.jsx            # Login / Register
│   │   │   ├── Partner.jsx         # Mechanic sign-up page
│   │   │   ├── HowItWorks.jsx      # Info page
│   │   │   ├── AdminDashboard.jsx  # Admin management panel
│   │   │   ├── MechanicDashboard.jsx # Mechanic job panel
│   │   │   └── Unauthorized.jsx    # 403 page
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express backend
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Mechanic.js         # Mechanic schema
│   │   ├── ServiceRequest.js   # Service request schema
│   │   └── Message.js          # Chat message schema
│   ├── routes/
│   │   ├── userRoutes.js       # Auth & user endpoints
│   │   ├── serviceRoutes.js    # Service request endpoints
│   │   ├── mechanicRoutes.js   # Mechanic endpoints
│   │   ├── adminRoutes.js      # Admin-only endpoints
│   │   └── chatRoutes.js       # Chat history endpoints
│   ├── middleware/             # Auth & validation middleware
│   ├── validators/             # Zod validation schemas
│   ├── socket.js               # Socket.IO instance singleton
│   ├── seedAdmin.js            # Script to seed an admin user
│   ├── index.js                # Server entry point
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/carcare.git
cd carcare
```

### 2. Configure Environment Variables

**Server** — create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carcare
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
```

**Client** — create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Seed Admin User (Optional)

```bash
cd server
node seedAdmin.js
```

### 5. Run the Application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/users/register` | Register a new user | Public |
| `POST` | `/api/users/login` | Login & receive JWT | Public |
| `GET` | `/api/users/profile` | Get current user profile | User |
| `GET` | `/api/services` | List all service requests | Admin/Mechanic |
| `POST` | `/api/services` | Create a service request | User |
| `PUT` | `/api/services/:id` | Update service request status | Mechanic/Admin |
| `GET` | `/api/mechanics` | List all mechanics | Admin |
| `PUT` | `/api/mechanics/:id` | Update mechanic details | Mechanic/Admin |
| `GET` | `/api/admin/users` | List all users | Admin |
| `DELETE` | `/api/admin/users/:id` | Delete a user | Admin |
| `GET` | `/api/chat/:requestId` | Get chat history for a request | User/Mechanic |

---

## 🔌 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | Client → Server | Join a service request chat room |
| `chatMessage` | Client → Server | Send a chat message |
| `newMessage` | Server → Client | Receive a new chat message |
| `mechanicLocationUpdate` | Client → Server | Mechanic shares GPS coordinates |
| `tracking_<requestId>` | Server → Client | Broadcast mechanic location to user |

---

## 👥 User Roles

| Role | Access |
|---|---|
| `user` | Home, Services, Booking, Chat, Live Tracking |
| `mechanic` | Mechanic Dashboard, Chat, Location Sharing |
| `admin` | Admin Dashboard, full platform management |

---

## 📜 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

> Built with ❤️ for roadside peace of mind.
