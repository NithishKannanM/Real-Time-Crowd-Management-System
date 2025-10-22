const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const DBSCAN = require('density-clustering').DBSCAN;
require('dotenv').config();

const Zone = require('./models/Zone');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_management';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('\n💡 MongoDB is not running or not installed.');
    console.error('   Option 1: Install MongoDB locally');
    console.error('   Option 2: Use MongoDB Atlas (cloud): https://cloud.mongodb.com');
    console.error('   Option 3: Run with Docker: docker run -d -p 27017:27017 mongo\n');
  });

// Handle MongoDB connection issues
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});


// Campus zones configuration
const ZONES = [
  { id: 'AB1', name: 'AB1', capacity: 5880 },
  { id: 'AB2', name: 'AB2', capacity: 250 },
  { id: 'AB3', name: 'AB3', capacity: 5880 },
  { id: 'AB4', name: 'AB4', capacity: 5880 },
  { id: 'Library', name: 'Library', capacity: 300 },
  { id: 'Admin', name: 'Admin Block', capacity: 250 },
  { id: 'North', name: 'North Square', capacity: 200 },
  { id: 'Gazebo', name: 'Gazebo', capacity: 200 },
  { id: 'MBA', name: 'MBA Amphitheater', capacity: 150 }
];

// Simulate network activity and generate crowd data
function generateNetworkActivity() {
  const data = ZONES.map(zone => {
    // Simulate Wi-Fi connected devices with realistic variance
    const basePopulation = zone.capacity * 0.3; // 30% base occupancy
    const variance = Math.random() * zone.capacity * 0.5; // Up to 50% variance
    const population = Math.floor(basePopulation + variance);
    
    // Generate random coordinates for DBSCAN clustering
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      population: population,
      capacity: zone.capacity,
      coordinates: [x, y]
    };
  });
  
  return data;
}

// Apply DBSCAN clustering to detect crowd density
function applyDBSCAN(zoneData) {
  const dbscan = new DBSCAN();
  
  // Extract coordinates for clustering
  const coordinates = zoneData.map(z => z.coordinates);
  
  // Run DBSCAN (epsilon: 30, minPoints: 2)
  const clusters = dbscan.run(coordinates, 30, 2);
  
  // Assign cluster IDs to zones
  const clusteredData = zoneData.map((zone, idx) => {
    let clusterId = -1; // Noise point by default
    
    clusters.forEach((cluster, clusterIdx) => {
      if (cluster.includes(idx)) {
        clusterId = clusterIdx;
      }
    });
    
    // Calculate density based on population and capacity
    const density = Math.floor((zone.population / zone.capacity) * 120);
    
    // Determine crowd status
    const percentage = (zone.population / zone.capacity) * 100;
    let status = 'normal';
    if (percentage > 85) status = 'overcrowded';
    else if (percentage > 60) status = 'moderate';
    
    return {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      population: zone.population,
      density: density,
      cluster: clusterId === -1 ? 0 : clusterId + 1,
      capacity: zone.capacity,
      status: status,
      timestamp: new Date()
    };
  });
  
  return clusteredData;
}

// Save zone data to MongoDB
async function saveZoneData(zoneData) {
  try {
    await Zone.insertMany(zoneData);
    console.log('📊 Zone data saved to MongoDB');
  } catch (error) {
    console.error('❌ Error saving zone data:', error);
  }
}

// Real-time data generation and broadcasting
function startRealTimeUpdates() {
  setInterval(async () => {
    console.log('🔄 Generating new crowd data...');
    
    // Generate network activity
    const networkData = generateNetworkActivity();
    
    // Apply DBSCAN clustering
    const clusteredData = applyDBSCAN(networkData);
    
    // Save to MongoDB
    await saveZoneData(clusteredData);
    
    // Broadcast to all connected clients
    io.emit('zoneUpdate', clusteredData);
    
    console.log('✅ Data broadcasted to clients');
  }, 5000); // Update every 5 seconds
}

// REST API Endpoints

// Get latest zone data
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await Zone.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$zoneId',
          zoneName: { $first: '$zoneName' },
          population: { $first: '$population' },
          density: { $first: '$density' },
          cluster: { $first: '$cluster' },
          capacity: { $first: '$capacity' },
          status: { $first: '$status' },
          timestamp: { $first: '$timestamp' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: zones,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get historical data for a specific zone
app.get('/api/history/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const history = await Zone.find({
      zoneId: zoneId,
      timestamp: { $gte: fifteenMinutesAgo }
    }).sort({ timestamp: 1 });
    
    res.json({
      success: true,
      zoneId: zoneId,
      data: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get summary statistics
app.get('/api/summary', async (req, res) => {
  try {
    const latestZones = await Zone.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$zoneId',
          population: { $first: '$population' },
          status: { $first: '$status' }
        }
      }
    ]);
    
    const totalPopulation = latestZones.reduce((sum, z) => sum + z.population, 0);
    const activeZones = latestZones.filter(z => z.population > 0).length;
    const overcrowdedZones = latestZones.filter(z => z.status === 'overcrowded').length;
    
    res.json({
      success: true,
      summary: {
        totalPopulation,
        activeZones,
        overcrowdedZones,
        totalZones: ZONES.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
  
  socket.on('requestUpdate', async () => {
    const networkData = generateNetworkActivity();
    const clusteredData = applyDBSCAN(networkData);
    socket.emit('zoneUpdate', clusteredData);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server active`);
  
  // Start real-time updates
  startRealTimeUpdates();
});

module.exports = { app, server };