const jwt = require('jsonwebtoken');
const User = require('../User');
const SOS = require('../SOS');
const Consultation = require('../Consultation');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = decoded.userId;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Setup Socket.IO handlers
const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`👤 User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle SOS events
    setupSOSHandlers(socket, io);

    // Handle video call events
    setupVideoCallHandlers(socket, io);

    // Handle chat events
    setupChatHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👤 User ${socket.userId} disconnected`);
    });
  });

  console.log('🔌 Socket.IO handlers setup complete');
};

// SOS event handlers
const setupSOSHandlers = (socket, io) => {
  // Join SOS namespace
  socket.on('join_sos', () => {
    socket.join('sos_alerts');
    console.log(`🚨 User ${socket.userId} joined SOS alerts`);
  });

  // Handle SOS trigger
  socket.on('trigger_sos', async (data) => {
    try {
      const { location, emergencyType, description, language } = data;

      // Emit immediate acknowledgment
      socket.emit('sos_acknowledged', {
        message: language === 'ta' 
          ? 'SOS சிக்னல் பெறப்பட்டது. அவசர சேவைகள் அறிவிக்கப்படுகின்றன...'
          : 'SOS signal received. Notifying emergency services...'
      });

      // Broadcast to emergency responders (future feature)
      socket.to('sos_alerts').emit('emergency_alert', {
        userId: socket.userId,
        location,
        emergencyType,
        timestamp: new Date(),
        priority: 'critical'
      });

      console.log(`🚨 SOS triggered by user ${socket.userId}`);
    } catch (error) {
      console.error('SOS socket error:', error);
      socket.emit('sos_error', {
        message: 'Failed to process SOS signal'
      });
    }
  });

  // Handle SOS status updates
  socket.on('sos_status_update', async (data) => {
    try {
      const { sosId, status } = data;
      
      // Update SOS record
      const sos = await SOS.findOneAndUpdate(
        { _id: sosId, userId: socket.userId },
        { status, responseTime: status === 'responded' ? new Date() : undefined },
        { new: true }
      );

      if (sos) {
        socket.emit('sos_updated', { sos });
        
        // Notify emergency responders
        socket.to('sos_alerts').emit('sos_status_changed', {
          sosId,
          status,
          userId: socket.userId
        });
      }
    } catch (error) {
      console.error('SOS status update error:', error);
    }
  });
};

// Video call event handlers
const setupVideoCallHandlers = (socket, io) => {
  // Join video call room
  socket.on('join_video_call', async (data) => {
    try {
      const { meetingId, consultationId } = data;

      // Verify consultation exists and user has access
      const consultation = await Consultation.findOne({
        _id: consultationId,
        $or: [
          { userId: socket.userId },
          { doctorId: socket.userId } // For doctor access (future)
        ],
        meetingId
      });

      if (!consultation) {
        socket.emit('video_call_error', {
          message: 'Invalid meeting or access denied'
        });
        return;
      }

      // Join meeting room
      socket.join(`meeting_${meetingId}`);
      
      // Notify other participants
      socket.to(`meeting_${meetingId}`).emit('participant_joined', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });

      socket.emit('video_call_joined', {
        meetingId,
        consultationId,
        participants: await getParticipants(meetingId, io)
      });

      console.log(`📹 User ${socket.userId} joined video call ${meetingId}`);
    } catch (error) {
      console.error('Video call join error:', error);
      socket.emit('video_call_error', {
        message: 'Failed to join video call'
      });
    }
  });

  // Handle WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    const { meetingId, offer, targetUserId } = data;
    socket.to(`meeting_${meetingId}`).emit('webrtc_offer', {
      offer,
      fromUserId: socket.userId,
      targetUserId
    });
  });

  socket.on('webrtc_answer', (data) => {
    const { meetingId, answer, targetUserId } = data;
    socket.to(`meeting_${meetingId}`).emit('webrtc_answer', {
      answer,
      fromUserId: socket.userId,
      targetUserId
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const { meetingId, candidate, targetUserId } = data;
    socket.to(`meeting_${meetingId}`).emit('webrtc_ice_candidate', {
      candidate,
      fromUserId: socket.userId,
      targetUserId
    });
  });

  // Leave video call
  socket.on('leave_video_call', (data) => {
    const { meetingId } = data;
    
    socket.leave(`meeting_${meetingId}`);
    socket.to(`meeting_${meetingId}`).emit('participant_left', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });

    console.log(`📹 User ${socket.userId} left video call ${meetingId}`);
  });
};

// Chat event handlers
const setupChatHandlers = (socket, io) => {
  // Join chat room
  socket.on('join_chat', (data) => {
    const { chatId } = data;
    socket.join(`chat_${chatId}`);
    console.log(`💬 User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name
    });
  });

  socket.on('typing_stop', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
      userId: socket.userId
    });
  });

  // Handle message delivery confirmation
  socket.on('message_delivered', (data) => {
    const { chatId, messageId } = data;
    socket.to(`chat_${chatId}`).emit('message_status_update', {
      messageId,
      status: 'delivered',
      userId: socket.userId
    });
  });
};

// Helper functions
const getParticipants = async (meetingId, io) => {
  try {
    const room = io.sockets.adapter.rooms.get(`meeting_${meetingId}`);
    if (!room) return [];

    const participants = [];
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        participants.push({
          userId: socket.userId,
          userName: socket.user.name,
          socketId
        });
      }
    }
    return participants;
  } catch (error) {
    console.error('Get participants error:', error);
    return [];
  }
};

module.exports = {
  setupSocketHandlers
};