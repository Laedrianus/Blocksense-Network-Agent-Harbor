const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const routes = require('./routes');
const setupSocket = require('./socket');
const { initializeDocker } = require('./services/dockerService');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Security: Restrict CORS to client URL
app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
}));
app.use(express.json());

// Use extracted routes
app.use('/api', routes);

const server = http.createServer(app);

// Initialize Socket.io with secure CORS
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// Setup socket logic
setupSocket(io);

// Initialize Docker and start server
(async () => {
    await initializeDocker();
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
})();