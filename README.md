# 🎓 Real-Time Student Crowd Management via Network Activity Analysis

A full-stack MERN application that simulates and visualizes real-time student crowd levels across various campus zones using network activity data and DBSCAN clustering algorithm.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-success) ![Node](https://img.shields.io/badge/Node-14%2B-green) ![MongoDB](https://img.shields.io/badge/MongoDB-6.0-brightgreen)

## 🎯 Project Overview

This Computer Networks demo project demonstrates real-time crowd management using:
- **DBSCAN Clustering** for density-based crowd detection
- **Socket.IO** for real-time bi-directional communication
- **MongoDB** for time-series data storage
- **React + Recharts** for interactive data visualization

### Key Features

✅ Real-time crowd monitoring across 9 campus zones  
✅ DBSCAN-based density clustering  
✅ Live WebSocket updates every 5 seconds  
✅ Historical data tracking and forecasting  
✅ Color-coded zone status (Normal/Moderate/Overcrowded)  
✅ Interactive charts and statistics  
✅ Responsive modern UI with animations  

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Frontend  │◄────────┤   Socket.IO  │────────►│   Backend  │
│  (React)    │  WSS    │              │         │  (Node.js) │
└─────────────┘         └──────────────┘         └─────┬──────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │   MongoDB   │
                                                 └─────────────┘
```

## 🧱 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **density-clustering** - DBSCAN implementation

### Frontend
- **React 18** - UI library
- **Recharts** - Chart visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket client

## 📂 Project Structure

```
RealTime_Crowd_Management_MERN/
│
├── backend/
│   ├── server.js              # Main server file
│   ├── models/
│   │   └── Zone.js            # MongoDB schema
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── socket.js          # Socket.IO client
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── package.json
│   └── tailwind.config.js
│
├── README.md
└── Project_Report.pdf
```

## 🏫 Campus Zones

| Zone              | Capacity | Default Population |
|-------------------|----------|--------------------|
| AB1               | 5880     | ~4625              |
| AB2               | 250      | ~871               |
| AB3               | 5880     | ~2579              |
| AB4               | 5880     | ~525               |
| Library           | 300      | ~448               |
| Admin Block       | 250      | ~169               |
| North Square      | 200      | Variable           |
| Gazebo            | 200      | Variable           |
| MBA Amphitheater  | 150      | Variable           |

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/crowd-management-mern.git
cd crowd-management-mern
```

### Step 2: Setup Backend

```bash
cd backend
npm install

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/crowd_management" > .env
echo "PORT=5000" >> .env

# Start MongoDB (if not running)
mongod

# Start backend server
npm start
```

Expected output:
```
✅ MongoDB Connected
🚀 Server running on port 5000
📡 Socket.IO server active
🔄 Generating new crowd data...
```

### Step 3: Setup Frontend

```bash
cd frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> .env

# Start React app
npm start
```

The application will open at `http://localhost:3000`

## 🧮 DBSCAN Algorithm Implementation

### How It Works

1. **Data Generation**: Simulates network activity (Wi-Fi connections) for each zone
2. **Coordinate Assignment**: Assigns random 2D coordinates to each zone
3. **DBSCAN Clustering**: 
   - **Epsilon (ε)**: 30 units (neighborhood radius)
   - **MinPoints**: 2 (minimum points to form cluster)
4. **Density Calculation**: `density = (population / capacity) × 120`
5. **Status Assignment**:
   - 🟢 Normal: ≤60% capacity
   - 🟡 Moderate: 60-85% capacity
   - 🔴 Overcrowded: >85% capacity

### Code Snippet

```javascript
function applyDBSCAN(zoneData) {
  const dbscan = new DBSCAN();
  const coordinates = zoneData.map(z => z.coordinates);
  
  // Run DBSCAN (epsilon: 30, minPoints: 2)
  const clusters = dbscan.run(coordinates, 30, 2);
  
  // Assign clusters and calculate density
  return zoneData.map((zone, idx) => {
    let clusterId = -1;
    clusters.forEach((cluster, clusterIdx) => {
      if (cluster.includes(idx)) clusterId = clusterIdx;
    });
    
    const density = Math.floor((zone.population / zone.capacity) * 120);
    const percentage = (zone.population / zone.capacity) * 100;
    
    let status = 'normal';
    if (percentage > 85) status = 'overcrowded';
    else if (percentage > 60) status = 'moderate';
    
    return { ...zone, clusterId, density, status };
  });
}
```

## 📡 Real-Time Communication Flow

### Socket.IO Events

**Server → Client**
- `zoneUpdate` - Sends updated zone data every 5 seconds

**Client → Server**
- `requestUpdate` - Manually request data update
- `connection` - Establish WebSocket connection
- `disconnect` - Handle client disconnection

### Data Flow

```
1. Backend generates simulated network activity
   ↓
2. DBSCAN clustering applied
   ↓
3. Data saved to MongoDB
   ↓
4. Broadcast to all connected clients via Socket.IO
   ↓
5. Frontend updates UI in real-time
```

## 📊 API Endpoints

### REST API

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/api/zones`          | Get latest data for all zones  |
| GET    | `/api/history/:zoneId`| Get 15-min history for a zone  |
| GET    | `/api/summary`        | Get summary statistics         |
| GET    | `/health`             | Health check endpoint          |

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "zoneId": "AB1",
      "zoneName": "AB1",
      "population": 4625,
      "density": 108,
      "cluster": 2,
      "capacity": 5880,
      "status": "normal",
      "timestamp": "2025-10-21T11:36:04.000Z"
    }
  ]
}
```

## 🎨 UI Components

### Dashboard Features

1. **Header**: Real-time clock, connection status, refresh button
2. **Stats Cards**: Total population, active zones, avg density, flow trend
3. **Line Chart**: Population trend over past 6 hours
4. **Bar Chart**: Forecast for next 6 hours
5. **Zone Cards**: Individual zone status with color coding

### Color Scheme

- **Background**: Dark gradient (slate-900 → slate-800)
- **Cards**: Semi-transparent slate-800 with blur effect
- **Status Colors**:
  - 🟢 Green (Normal): `#10b981`
  - 🟡 Yellow (Moderate): `#eab308`
  - 🔴 Red (Overcrowded): `#ef4444`

## 🧪 Testing

### Backend Testing

```bash
# Test MongoDB connection
curl http://localhost:5000/health

# Test zones endpoint
curl http://localhost:5000/api/zones

# Test summary endpoint
curl http://localhost:5000/api/summary

# Test zone history
curl http://localhost:5000/api/history/AB1
```

### Frontend Testing

1. Open browser console (F12)
2. Check WebSocket connection: `✅ Connected to Socket.IO server`
3. Monitor real-time updates: `📡 Received zone update`
4. Verify data refresh every 5 seconds

## 📈 Performance Optimization

- **Debouncing**: Limits update frequency to 5 seconds
- **MongoDB Indexing**: Optimized queries with compound indexes
- **React Memoization**: Prevents unnecessary re-renders
- **WebSocket Compression**: Reduces data transfer size
- **Chart Throttling**: Smooth animations without lag

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Solution: Start MongoDB service
mongod --dbpath /path/to/data
```

**Port Already in Use**
```bash
# Solution: Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Socket.IO Connection Failed**
```bash
# Solution: Check CORS settings and backend URL
# In frontend/.env
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Recharts Not Rendering**
```bash
# Solution: Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🔒 Security Considerations

- ✅ CORS configured for specific origins
- ✅ Input validation on API endpoints
- ✅ Rate limiting on Socket.IO connections
- ✅ MongoDB injection prevention via Mongoose
- ✅ Environment variables for sensitive data

## 📝 Future Enhancements

- [ ] User authentication (JWT)
- [ ] Push notifications for overcrowding
- [ ] Historical data analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Machine learning predictions
- [ ] Multi-campus support
- [ ] Export reports (PDF/Excel)
- [ ] Admin panel for zone management

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request


## 👥 Authors

- **Nithish Kannan M** - *Initial work* - [GitHub Profile](https://github.com/NithishKannanM)

## 🙏 Acknowledgments

- **DBSCAN Algorithm** - Martin Ester, Hans-Peter Kriegel (1996)
- **Socket.IO** - Real-time communication library
- **Recharts** - Chart visualization library
- **MongoDB** - NoSQL database
- **React Community** - UI framework and ecosystem

## 📚 References

1. [DBSCAN Clustering Algorithm](https://en.wikipedia.org/wiki/DBSCAN)
2. [Socket.IO Documentation](https://socket.io/docs/)
3. [MongoDB Best Practices](https://docs.mongodb.com/manual/)
4. [React Performance Optimization](https://react.dev/learn)
5. [Recharts Documentation](https://recharts.org/)

## 📞 Support

For issues or questions:
- 📧 Email: nithishkannanm1@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/NithishKannanM/Real-Time-Crowd-Management-System/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/NithishKannanM/Real-Time-Crowd-Management-System/discussions)

---

**Made with ❤️ for Computer Networks Project**

**⭐ Star this repo if you find it helpful!**
