import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, TrendingUp, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { subscribeToZoneUpdates, requestManualUpdate, getConnectionStatus } from './socket';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const App = () => {
  const [zones, setZones] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [summary, setSummary] = useState({
    totalPopulation: 0,
    activeZones: 0,
    avgDensity: 0,
    flowTrend: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [zonesRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/zones`),
        axios.get(`${API_URL}/summary`)
      ]);

      if (zonesRes.data.success) {
        setZones(zonesRes.data.data.map(z => ({
          id: z._id,
          name: z.zoneName,
          population: z.population,
          density: z.density,
          cluster: z.cluster,
          capacity: z.capacity,
          status: z.status
        })));
      }

      if (summaryRes.data.success) {
        updateSummary(summaryRes.data.summary);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Subscribe to real-time updates via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribeToZoneUpdates((data) => {
      console.log('📡 Received zone update:', data);
      
      setZones(data.map(z => ({
        id: z.zoneId,
        name: z.zoneName,
        population: z.population,
        density: z.density,
        cluster: z.cluster,
        capacity: z.capacity,
        status: z.status
      })));

      // Update trend data
      const totalPop = data.reduce((sum, z) => sum + z.population, 0);
      setTrendData(prev => {
        const newData = [...prev];
        if (newData.length >= 12) newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          population: totalPop
        });
        return newData;
      });

      // Update summary
      const activeZones = data.filter(z => z.population > 0).length;
      const avgDensity = Math.floor(data.reduce((sum, z) => sum + z.density, 0) / data.length);
      
      setSummary(prev => ({
        totalPopulation: totalPop,
        activeZones: activeZones,
        avgDensity: avgDensity,
        flowTrend: prev.flowTrend
      }));
    });

    // Check connection status
    const interval = setInterval(() => {
      setIsConnected(getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate forecast data
  useEffect(() => {
    if (trendData.length > 0) {
      const lastPop = trendData[trendData.length - 1].population;
      const forecast = [];
      for (let i = 1; i <= 6; i++) {
        const variance = (Math.random() - 0.5) * 1000;
        forecast.push({
          time: `${i}h later`,
          population: Math.max(8000, Math.min(12000, lastPop + variance))
        });
      }
      setForecastData(forecast);
    }
  }, [trendData]);

  const updateSummary = (data) => {
    setSummary({
      totalPopulation: data.totalPopulation,
      activeZones: data.activeZones,
      avgDensity: 0,
      flowTrend: 0
    });
  };

  const handleRefresh = () => {
    requestManualUpdate();
    fetchInitialData();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'overcrowded': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-emerald-500';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'overcrowded': return 'bg-red-500/10 border-red-500/30';
      case 'moderate': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const calculateFlowTrend = () => {
    if (trendData.length < 2) return '0.0';
    const latest = trendData[trendData.length - 1].population;
    const previous = trendData[trendData.length - 2].population;
    return (((latest - previous) / previous) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Crowd Management System</h1>
            <p className="text-slate-400 text-sm">with DBSCAN Technology</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
          <div className="text-sm text-slate-400">
            Last Update: {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Population</p>
              <h3 className="text-3xl font-bold">{summary.totalPopulation.toLocaleString()}</h3>
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                -5% vs last hour
              </p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Zones</p>
              <h3 className="text-3xl font-bold">{summary.activeZones}</h3>
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +0% vs last hour
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Avg Density</p>
              <h3 className="text-3xl font-bold">{summary.avgDensity} ppl/unit</h3>
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                -4% vs last hour
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Flow Trend</p>
              <h3 className="text-3xl font-bold">{calculateFlowTrend()}%</h3>
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +1% vs last hour
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Population Trend (Past 6 Hours)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="population" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Forecast (Next 6 Hours)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Bar dataKey="population" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Cards */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Zone-wise Population</h3>
        <div className="grid grid-cols-3 gap-4">
          {zones.map(zone => (
            <div 
              key={zone.id}
              className={`border rounded-xl p-5 transition-all duration-500 hover:scale-105 ${getStatusBg(zone.status)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{zone.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(zone.status)}`}></div>
                    <span className="text-xs text-slate-400 capitalize">{zone.status}</span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(zone.status)}`}></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Population:</span>
                  <span className="font-semibold text-blue-400">{zone.population}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Density:</span>
                  <span className="font-semibold text-cyan-400">{zone.density}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cluster:</span>
                  <span className="font-semibold text-purple-400">#{zone.cluster}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;