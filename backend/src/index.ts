import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

// Import routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import rideRoutes from './routes/rideRoutes'
import googleSheetsRoutes from './routes/googleSheetsRoutes'
import notificationRoutes from './routes/notificationRoutes'

// Import middleware
import { errorHandler, notFoundHandler, validateJSON } from './middleware/errorHandler'
import { generalRateLimiter } from './middleware/rateLimiter'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Compression
app.use(compression())

// Logging
app.use(morgan('combined'))

// Rate limiting
app.use(generalRateLimiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// JSON validation
app.use(validateJSON)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/rides', rideRoutes)
app.use('/api/sheets', googleSheetsRoutes)
app.use('/api/notifications', notificationRoutes)

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join user to their role-based room
  socket.on('join-role', (role: string) => {
    socket.join(`role-${role}`)
    console.log(`User ${socket.id} joined role room: role-${role}`)
  })

  // Join user to their personal room
  socket.on('join-user', (userId: string) => {
    socket.join(`user-${userId}`)
    console.log(`User ${socket.id} joined user room: user-${userId}`)
  })

  // Handle ride status updates
  socket.on('ride-status-update', (data: any) => {
    // Broadcast to relevant users
    io.to(`role-${data.role}`).emit('ride-status-changed', data)
  })

  // Handle notifications
  socket.on('notification', (data: any) => {
    if (data.userId) {
      io.to(`user-${data.userId}`).emit('notification', data)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Make io available to other modules
app.set('io', io)

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`)
  console.log(`📅 Started at: ${new Date().toISOString()}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

export default app
