#!/bin/bash

echo "🚀 Starting Real-Time Crowd Management System Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}⚠️  MongoDB is not installed or not in PATH${NC}"
    echo "Please install MongoDB from: https://www.mongodb.com/try/download/community"
    echo "Or start MongoDB using Docker: docker run -d -p 27017:27017 mongo"
fi

echo ""
echo -e "${BLUE}📦 Installing Backend Dependencies...${NC}"
cd backend
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Backend installation failed${NC}"
    exit 1
fi

# Create .env file for backend
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating backend .env file...${NC}"
    cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/crowd_management
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SOCKET_UPDATE_INTERVAL=5000
DBSCAN_EPSILON=30
DBSCAN_MIN_POINTS=2
EOF
    echo -e "${GREEN}✅ Backend .env created${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}📦 Installing Frontend Dependencies...${NC}"
cd frontend
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Frontend installation failed${NC}"
    exit 1
fi

# Create .env file for frontend
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating frontend .env file...${NC}"
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_UPDATE_INTERVAL=5000
REACT_APP_CHART_HISTORY_LIMIT=12
EOF
    echo -e "${GREEN}✅ Frontend .env created${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}🚀 To start the application:${NC}"
echo ""
echo "1. Start MongoDB (if not running):"
echo "   mongod"
echo ""
echo "2. Start Backend (in new terminal):"
echo "   cd backend && npm start"
echo ""
echo "3. Start Frontend (in another terminal):"
echo "   cd frontend && npm start"
echo ""
echo -e "${GREEN}📱 Application will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}🔌 API will be available at: http://localhost:5000${NC}"
echo ""