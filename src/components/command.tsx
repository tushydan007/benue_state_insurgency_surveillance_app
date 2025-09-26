// THE MAP WITH SQUARE BOUNDARY
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Shield,
  MapPin,
  Camera,
  Users,
  Clock,
  Volume2,
  VolumeX,
  Eye,
  Zap,
  Target,
  Bell,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GeoJSON } from "react-leaflet";
import benueBoundaryData from "../data/benue1.geojson.json";
import type { FeatureCollection } from "geojson";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Sensor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  lastUpdate: Date;
  batteryLevel: number;
}

interface Threat {
  id: string;
  sensorId: string;
  type: string;
  severity: string;
  location: { lat: number; lng: number; name: string };
  timestamp: Date;
  description: string;
  personnel: number;
  status: string;
}

const CommandCenter = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const audioRef = useRef<HTMLAudioElement>(null);
  // const wsRef = useRef<WebSocket | null>(null); Reopen this when you are ready for backend integration



  // Mock data for demonstration
  useEffect(() => {
    const mockSensors = [
      {
        id: "S001",
        name: "Makurdi Border North",
        lat: 7.7319,
        lng: 8.5211,
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 85,
      },
      {
        id: "S002",
        name: "Gboko Checkpoint",
        lat: 7.3239,
        lng: 9.0043,
        status: "alert",
        lastUpdate: new Date(),
        batteryLevel: 92,
      },
      {
        id: "S003",
        name: "Otukpo Border East",
        lat: 7.1905,
        lng: 8.1301,
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 78,
      },
      {
        id: "S004",
        name: "Katsina-Ala West",
        lat: 7.1667,
        lng: 9.2833,
        status: "inactive",
        lastUpdate: new Date(Date.now() - 300000),
        batteryLevel: 45,
      },
      {
        id: "S005",
        name: "Vandeikya South",
        lat: 6.7833,
        lng: 9.0667,
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 95,
      },
    ];

    const mockThreats = [
      {
        id: "T001",
        sensorId: "S002",
        type: "armed_group",
        severity: "critical",
        location: { lat: 7.3239, lng: 9.0043, name: "Gboko Checkpoint" },
        timestamp: new Date(Date.now() - 120000),
        description:
          "Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.",
        personnel: 10,
        status: "active",
      },
      {
        id: "T002",
        sensorId: "S001",
        type: "vehicle_movement",
        severity: "medium",
        location: { lat: 7.7319, lng: 8.5211, name: "Makurdi Border North" },
        timestamp: new Date(Date.now() - 300000),
        description:
          "Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.",
        personnel: 5,
        status: "investigating",
      },
      {
        id: "T003",
        sensorId: "S003",
        type: "intrusion",
        severity: "high",
        location: { lat: 7.1905, lng: 8.1301, name: "Otukpo Border East" },
        timestamp: new Date(Date.now() - 600000),
        description:
          "Unauthorized border crossing detected. Multiple individuals attempting to bypass checkpoint.",
        personnel: 6,
        status: "active",
      },
    ];

    setSensors(mockSensors);
    setThreats(mockThreats);
  }, []);

  // WebSocket connection simulation
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus("reconnecting");

      // Simulate WebSocket connection
      setTimeout(() => {
        setConnectionStatus("connected");

        // Simulate real-time updates
        const interval = setInterval(() => {
          const now = new Date();

          // Update sensor data
          setSensors((prev) =>
            prev.map((sensor) => ({
              ...sensor,
              lastUpdate: now,
              batteryLevel: Math.max(
                20,
                sensor.batteryLevel - Math.random() * 0.5
              ),
            }))
          );

          // Occasionally add new threats
          if (Math.random() < 0.1) {
            const newThreat = {
              id: `T${Date.now()}`,
              sensorId:
                sensors[Math.floor(Math.random() * sensors.length)]?.id ||
                "S001",
              type: [
                "intrusion",
                "suspicious_activity",
                "armed_group",
                "vehicle_movement",
              ][Math.floor(Math.random() * 4)],
              severity: ["low", "medium", "high", "critical"][
                Math.floor(Math.random() * 4)
              ],
              location: {
                lat: 7 + Math.random(),
                lng: 8 + Math.random(),
                name: "New Location",
              },
              timestamp: now,
              description:
                "New threat detected by automated surveillance system.",
              personnel: Math.floor(Math.random() * 15) + 1,
              status: "active",
            };

            setThreats((prev) => [newThreat, ...prev.slice(0, 9)]);

            // Play alert sound for critical threats
            if (
              newThreat.severity === "critical" &&
              soundEnabled &&
              audioRef.current
            ) {
              audioRef.current
                .play()
                .catch((e) => console.log("Audio play failed:", e));
            }
          }
        }, 5000);

        return () => {
          clearInterval(interval);
        };
      }, 1000);
    };

    connectWebSocket();
  }, [sensors, soundEnabled]);

  interface SeverityColorMap {
    [key: string]: string;
  }

  const getSeverityColor = (severity: keyof SeverityColorMap): string => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  interface StatusColorMap {
    [key: string]: string;
  }

  type SensorStatus = "active" | "inactive" | "alert";

  const getStatusColor = (status: SensorStatus): string => {
    const colorMap: StatusColorMap = {
      active: "text-green-400",
      inactive: "text-red-400",
      alert: "text-orange-400",
    };
    return colorMap[status] ?? "text-gray-400";
  };

  const activeCriticalThreats = threats.filter(
    (t) => t.severity === "critical" && t.status === "active"
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Audio element for alerts */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y"
          type="audio/wav"
        />
      </audio>

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Benue State Command Center</h1>
              <p className="text-slate-400">
                Border Security & Threat Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <span className="text-sm text-slate-400 capitalize">
                {connectionStatus}
              </span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${
                soundEnabled
                  ? "bg-blue-600 text-white"
                  : "bg-slate-600 text-slate-300"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <div className="text-right">
              <div className="text-sm font-medium">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {activeCriticalThreats.length > 0 && (
        <Alert variant="destructive" className="px-6 py-3 animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                CRITICAL ALERT: {activeCriticalThreats.length} active critical
                threat{activeCriticalThreats.length > 1 ? "s" : ""} detected
              </span>
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Statistics Cards */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sensors</p>
                  <p className="text-2xl font-bold text-green-400">
                    {sensors.filter((s) => s.status === "active").length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Threats</p>
                  <p className="text-2xl font-bold text-red-400">
                    {threats.filter((t) => t.status === "active").length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Personnel Deployed</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {threats.reduce((sum, t) => sum + t.personnel, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Benue State Border Map</span>
              </h2>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-1 text-sm text-blue-400">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>Sensors</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-red-400">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Threats</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-purple-400">
                  <Eye className="w-3 h-3" />
                  <span>Surveillance</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg h-[90vh]">
              <MapContainer
                center={[7.4, 8.6]}
                zoom={8}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Benue State Border */}
                {/* Benue State GeoJSON Boundary */}
                <GeoJSON
                  data={benueBoundaryData as FeatureCollection}
                  style={() => ({
                    color: "blue",
                    weight: 2,
                    fillOpacity: 0.2,
                    fillColor: "blue",
                  })}
                />

                {/* Sensors */}
                {sensors.map((sensor) => (
                  <Marker position={[sensor.lat, sensor.lng]} key={sensor.id}>
                    <Popup>
                      {sensor.name}
                      <br />
                      Status: {sensor.status}
                      <br />
                      Battery: {sensor.batteryLevel}%
                    </Popup>
                  </Marker>
                ))}
                {threats
                  .filter((t) => t.status === "active")
                  .map((threat) => (
                    <Circle
                      key={threat.id}
                      center={[threat.location.lat, threat.location.lng]}
                      radius={1000}
                      pathOptions={{
                        color:
                          threat.severity === "critical"
                            ? "red"
                            : threat.severity === "high"
                            ? "orange"
                            : threat.severity === "medium"
                            ? "yellow"
                            : "green",
                        fillOpacity: 0.5,
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedThreat(threat);
                        },
                      }}
                    >
                      <Popup>
                        {threat.type.replace("_", " ").toUpperCase()}
                        <br />
                        {threat.description}
                        <br />
                        Severity: {threat.severity.toUpperCase()}
                      </Popup>
                    </Circle>
                  ))}
              </MapContainer>
            </div>
          </div>

          {/* Video Feeds */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Live Video Feeds</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.slice(0, 6).map((sensor) => (
                <div key={sensor.id} className="bg-slate-700 rounded-lg p-3">
                  <div className="bg-black rounded aspect-video mb-2 flex items-center justify-center">
                    <div className="text-slate-400 text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-xs">Camera {sensor.id}</div>
                      <div className="text-xs">{sensor.name}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={getStatusColor(sensor.status as SensorStatus)}
                    >
                      {sensor.status}
                    </span>
                    <span className="text-slate-400">
                      Battery: {sensor.batteryLevel}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Threat List */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Active Threats</span>
          </h2>

          <div className="space-y-3">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-colors
                  ${
                    selectedThreat?.id === threat.id
                      ? "ring-2 ring-blue-400"
                      : ""
                  }
                  hover:bg-slate-600`}
                onClick={() => setSelectedThreat(threat)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                      threat.severity
                    )}`}
                  >
                    {threat.severity.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <h3 className="font-medium mb-1">
                  {threat.type.replace("_", " ").toUpperCase()}
                </h3>
                <p className="text-sm text-slate-300 mb-2">
                  {threat.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{threat.location.name}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{threat.personnel}</span>
                  </span>
                </div>

                <div className="mt-2 flex space-x-2">
                  <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
                    Deploy
                  </button>
                  <button className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sensor Status */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Sensor Status</span>
            </h3>

            <div className="space-y-2">
              {sensors.map((sensor) => (
                <div key={sensor.id} className="bg-slate-700 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{sensor.name}</span>
                    <span
                      className={`text-xs ${getStatusColor(
                        sensor.status as SensorStatus
                      )}`}
                    >
                      {sensor.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>ID: {sensor.id}</span>
                    <span>Battery: {sensor.batteryLevel.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-1 mt-1">
                    <div
                      className="bg-green-400 h-1 rounded-full"
                      style={{ width: `${sensor.batteryLevel}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Threat Detail Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Threat Details</h2>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Threat ID</label>
                  <p className="font-medium">{selectedThreat.id}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Severity</label>
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-medium ${getSeverityColor(
                      selectedThreat.severity
                    )}`}
                  >
                    {selectedThreat.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Description</label>
                <p className="text-slate-200">{selectedThreat.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Location</label>
                  <p className="font-medium">{selectedThreat.location.name}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">
                    Personnel Deployed
                  </label>
                  <p className="font-medium">{selectedThreat.personnel}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Timestamp</label>
                <p className="font-medium">
                  {selectedThreat.timestamp.toLocaleString()}
                </p>
              </div>

              <div className="flex space-x-3 mt-6">
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">
                  Deploy Emergency Response
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
                  Request Backup
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">
                  Mark Investigating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;










// MODIFICATION OF THE ORIGINAL CODE GIVEN TO ME BY CLAUDE AI MODIFIED BY GROK
// import { useState, useEffect, useRef } from 'react';
// import {
//   AlertTriangle,
//   Shield,
//   MapPin,
//   Camera,
//   Users,
//   Clock,
//   Volume2,
//   VolumeX,
//   Eye,
//   Zap,
//   Target,
//   Bell,
//   Activity
// } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

// interface Sensor {
//   id: string;
//   name: string;
//   lat: number;
//   lng: number;
//   status: 'active' | 'inactive' | 'alert';
//   lastUpdate: Date;
//   batteryLevel: number;
// }

// interface Threat {
//   id: string;
//   sensorId: string;
//   type: 'intrusion' | 'suspicious_activity' | 'armed_group' | 'vehicle_movement';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   location: { lat: number; lng: number; name: string };
//   timestamp: Date;
//   description: string;
//   personnel: number;
//   status: 'active' | 'investigating' | 'resolved';
// }

// const CommandCenter = () => {
//   const [sensors, setSensors] = useState<Sensor[]>([]);
//   const [threats, setThreats] = useState<Threat[]>([]);
//   const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
//   const [soundEnabled, setSoundEnabled] = useState(true);
//   const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);

//   // Mock data for demonstration
//   useEffect(() => {
//     const mockSensors: Sensor[] = [
//       { id: 'S001', name: 'Makurdi Border North', lat: 7.7319, lng: 8.5211, status: 'active', lastUpdate: new Date(), batteryLevel: 85 },
//       { id: 'S002', name: 'Gboko Checkpoint', lat: 7.3239, lng: 9.0043, status: 'alert', lastUpdate: new Date(), batteryLevel: 92 },
//       { id: 'S003', name: 'Otukpo Border East', lat: 7.1905, lng: 8.1301, status: 'active', lastUpdate: new Date(), batteryLevel: 78 },
//       { id: 'S004', name: 'Katsina-Ala West', lat: 7.1667, lng: 9.2833, status: 'inactive', lastUpdate: new Date(Date.now() - 300000), batteryLevel: 45 },
//       { id: 'S005', name: 'Vandeikya South', lat: 6.7833, lng: 9.0667, status: 'active', lastUpdate: new Date(), batteryLevel: 95 },
//     ];

//     const mockThreats: Threat[] = [
//       {
//         id: 'T001',
//         sensorId: 'S002',
//         type: 'armed_group',
//         severity: 'critical',
//         location: { lat: 7.3239, lng: 9.0043, name: 'Gboko Checkpoint' },
//         timestamp: new Date(Date.now() - 120000),
//         description: 'Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.',
//         personnel: 10,
//         status: 'active'
//       },
//       {
//         id: 'T002',
//         sensorId: 'S001',
//         type: 'vehicle_movement',
//         severity: 'medium',
//         location: { lat: 7.7319, lng: 8.5211, name: 'Makurdi Border North' },
//         timestamp: new Date(Date.now() - 300000),
//         description: 'Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.',
//         personnel: 5,
//         status: 'investigating'
//       },
//       {
//         id: 'T003',
//         sensorId: 'S003',
//         type: 'intrusion',
//         severity: 'high',
//         location: { lat: 7.1905, lng: 8.1301, name: 'Otukpo Border East' },
//         timestamp: new Date(Date.now() - 600000),
//         description: 'Unauthorized border crossing detected. Multiple individuals attempting to bypass checkpoint.',
//         personnel: 6,
//         status: 'active'
//       }
//     ];

//     setSensors(mockSensors);
//     setThreats(mockThreats);
//   }, []);

//   // WebSocket connection simulation
//   useEffect(() => {
//     const connectWebSocket = () => {
//       setConnectionStatus('reconnecting');

//       // Simulate WebSocket connection
//             setTimeout(() => {
//               setConnectionStatus('connected');

//               // Simulate real-time updates
//               const interval = setInterval(() => {
//                 const now = new Date();

//                 // Update sensor data
//                 setSensors(prev => prev.map(sensor => ({
//                   ...sensor,
//                   lastUpdate: now,
//                   batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.5)
//                 })));

//                 // Occasionally add new threats
//                 if (Math.random() < 0.1) {
//                   const newThreat: Threat = {
//                     id: `T${Date.now()}`,
//                     sensorId: sensors[Math.floor(Math.random() * sensors.length)]?.id || 'S001',
//                     type: ['intrusion', 'suspicious_activity', 'armed_group', 'vehicle_movement'][Math.floor(Math.random() * 4)] as Threat['type'],
//                     severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as Threat['severity'],
//                     location: { lat: 7 + Math.random(), lng: 8 + Math.random(), name: 'New Location' },
//                     timestamp: now,
//                     description: 'New threat detected by automated surveillance system.',
//                     personnel: Math.floor(Math.random() * 15) + 1,
//                     status: 'active'
//                   };

//                   setThreats(prev => [newThreat, ...prev.slice(0, 9)]);

//                   // Play alert sound for critical threats
//                   if (newThreat.severity === 'critical' && soundEnabled && audioRef.current) {
//                     audioRef.current.play().catch(e => console.log('Audio play failed:', e));
//                   }
//                 }
//               }, 5000);

//               return () => {
//                 clearInterval(interval);
//               };
//             }, 1000);
//     };

//     connectWebSocket();
//   }, [sensors, soundEnabled]);

// interface SeverityColorMap {
//     [key: string]: string;
// }

// const getSeverityColor = (severity: keyof SeverityColorMap): string => {
//     const colorMap: SeverityColorMap = {
//         critical: 'bg-red-600 text-white',
//         high: 'bg-red-500 text-white',
//         medium: 'bg-yellow-500 text-white',
//         low: 'bg-green-500 text-white',
//     };
//     return colorMap[severity] ?? 'bg-gray-500 text-white';
// };

// interface StatusColorMap {
//     [key: string]: string;
// }

// type SensorStatus = 'active' | 'inactive' | 'alert';

// const getStatusColor = (status: SensorStatus): string => {
//     const colorMap: StatusColorMap = {
//         active: 'text-green-400',
//         inactive: 'text-red-400',
//         alert: 'text-orange-400',
//     };
//     return colorMap[status] ?? 'text-gray-400';
// };

//   const activeCriticalThreats = threats.filter(t => t.severity === 'critical' && t.status === 'active');

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       {/* Audio element for alerts */}
//       <audio ref={audioRef} preload="auto">
//         <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y" type="audio/wav" />
//       </audio>

//       {/* Header */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Shield className="w-8 h-8 text-blue-400" />
//             <div>
//               <h1 className="text-2xl font-bold">Benue State Command Center</h1>
//               <p className="text-slate-400">Border Security & Threat Monitoring</p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
//               <span className="text-sm text-slate-400 capitalize">{connectionStatus}</span>
//             </div>

//             <button
//               onClick={() => setSoundEnabled(!soundEnabled)}
//               className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}
//             >
//               {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
//             </button>

//             <div className="text-right">
//               <div className="text-sm font-medium">{new Date().toLocaleTimeString()}</div>
//               <div className="text-xs text-slate-400">{new Date().toLocaleDateString()}</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Critical Alert Banner */}
//       {activeCriticalThreats.length > 0 && (
//         <Alert variant="destructive" className="px-6 py-3 animate-pulse">
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold">
//                 CRITICAL ALERT: {activeCriticalThreats.length} active critical threat{activeCriticalThreats.length > 1 ? 's' : ''} detected
//               </span>
//               <Bell className="w-5 h-5 animate-bounce" />
//             </div>
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="flex flex-1">
//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//             {/* Statistics Cards */}
//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Sensors</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {sensors.filter(s => s.status === 'active').length}
//                   </p>
//                 </div>
//                 <Activity className="w-8 h-8 text-green-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Threats</p>
//                   <p className="text-2xl font-bold text-red-400">
//                     {threats.filter(t => t.status === 'active').length}
//                   </p>
//                 </div>
//                 <Target className="w-8 h-8 text-red-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Personnel Deployed</p>
//                   <p className="text-2xl font-bold text-blue-400">
//                     {threats.reduce((sum, t) => sum + t.personnel, 0)}
//                   </p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </div>
//           </div>

//           {/* Map Area */}
//           <div className="bg-slate-800 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-lg font-semibold flex items-center space-x-2">
//                 <MapPin className="w-5 h-5" />
//                 <span>Benue State Border Map</span>
//               </h2>
//               <div className="flex space-x-4">
//                 <div className="flex items-center space-x-1 text-sm text-blue-400">
//                   <div className="w-3 h-3 bg-blue-400 rounded"></div>
//                   <span>Sensors</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-red-400">
//                   <div className="w-3 h-3 bg-red-400 rounded-full"></div>
//                   <span>Threats</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-purple-400">
//                   <Eye className="w-3 h-3" />
//                   <span>Surveillance</span>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-lg h-96">
//               <MapContainer center={[7.4, 8.6]} zoom={8} style={{ height: '100%', width: '100%' }}>
//                 <TileLayer
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />
//                 {sensors.map((sensor) => (
//                   <Marker position={[sensor.lat, sensor.lng]} key={sensor.id}>
//                     <Popup>
//                       {sensor.name}<br />Status: {sensor.status}<br />Battery: {sensor.batteryLevel}%
//                     </Popup>
//                   </Marker>
//                 ))}
//                 {threats.filter(t => t.status === 'active').map((threat) => (
//                   <Circle
//                     key={threat.id}
//                     center={[threat.location.lat, threat.location.lng]}
//                     radius={1000}
//                     pathOptions={{
//                       color: threat.severity === 'critical' ? 'red' : threat.severity === 'high' ? 'orange' : threat.severity === 'medium' ? 'yellow' : 'green',
//                       fillOpacity: 0.5
//                     }}
//                     eventHandlers={{
//                       click: () => {
//                         setSelectedThreat(threat);
//                       }
//                     }}
//                   >
//                     <Popup>
//                       {threat.type.replace('_', ' ').toUpperCase()}<br />
//                       {threat.description}<br />
//                       Severity: {threat.severity.toUpperCase()}
//                     </Popup>
//                   </Circle>
//                 ))}
//               </MapContainer>
//             </div>
//           </div>

//           {/* Video Feeds */}
//           <div className="bg-slate-800 rounded-lg p-4">
//             <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//               <Camera className="w-5 h-5" />
//               <span>Live Video Feeds</span>
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {sensors.slice(0, 6).map((sensor) => (
//                 <div key={sensor.id} className="bg-slate-700 rounded-lg p-3">
//                   <div className="bg-black rounded aspect-video mb-2 flex items-center justify-center">
//                     <div className="text-slate-400 text-center">
//                       <Camera className="w-8 h-8 mx-auto mb-2" />
//                       <div className="text-xs">Camera {sensor.id}</div>
//                       <div className="text-xs">{sensor.name}</div>
//                     </div>
//                   </div>
//                   <div className="flex justify-between items-center text-xs">
//                     <span className={getStatusColor(sensor.status)}>{sensor.status}</span>
//                     <span className="text-slate-400">Battery: {sensor.batteryLevel}%</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Sidebar - Threat List */}
//         <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span>Active Threats</span>
//           </h2>

//           <div className="space-y-3">
//             {threats.map((threat) => (
//               <div
//                 key={threat.id}
//                 className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-colors
//                   ${selectedThreat?.id === threat.id ? 'ring-2 ring-blue-400' : ''}
//                   hover:bg-slate-600`}
//                 onClick={() => setSelectedThreat(threat)}
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(threat.severity)}`}>
//                     {threat.severity.toUpperCase()}
//                   </span>
//                   <div className="flex items-center space-x-1 text-xs text-slate-400">
//                     <Clock className="w-3 h-3" />
//                     <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
//                   </div>
//                 </div>

//                 <h3 className="font-medium mb-1">{threat.type.replace('_', ' ').toUpperCase()}</h3>
//                 <p className="text-sm text-slate-300 mb-2">{threat.description}</p>

//                 <div className="flex items-center justify-between text-xs text-slate-400">
//                   <span className="flex items-center space-x-1">
//                     <MapPin className="w-3 h-3" />
//                     <span>{threat.location.name}</span>
//                   </span>
//                   <span className="flex items-center space-x-1">
//                     <Users className="w-3 h-3" />
//                     <span>{threat.personnel}</span>
//                   </span>
//                 </div>

//                 <div className="mt-2 flex space-x-2">
//                   <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
//                     Deploy
//                   </button>
//                   <button className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500">
//                     Investigate
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Sensor Status */}
//           <div className="mt-6">
//             <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
//               <Zap className="w-4 h-4" />
//               <span>Sensor Status</span>
//             </h3>

//             <div className="space-y-2">
//               {sensors.map((sensor) => (
//                 <div key={sensor.id} className="bg-slate-700 rounded p-2">
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm font-medium">{sensor.name}</span>
//                     <span className={`text-xs ${getStatusColor(sensor.status)}`}>
//                       {sensor.status}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs text-slate-400">
//                     <span>ID: {sensor.id}</span>
//                     <span>Battery: {sensor.batteryLevel.toFixed(1)}%</span>
//                   </div>
//                   <div className="w-full bg-slate-600 rounded-full h-1 mt-1">
//                     <div
//                       className="bg-green-400 h-1 rounded-full"
//                       style={{ width: `${sensor.batteryLevel}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Threat Detail Modal */}
//       {selectedThreat && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl font-bold">Threat Details</h2>
//               <button
//                 onClick={() => setSelectedThreat(null)}
//                 className="text-slate-400 hover:text-white"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-slate-400">Threat ID</label>
//                   <p className="font-medium">{selectedThreat.id}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm text-slate-400">Severity</label>
//                   <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getSeverityColor(selectedThreat.severity)}`}>
//                     {selectedThreat.severity.toUpperCase()}
//                   </span>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-slate-400">Description</label>
//                 <p className="text-slate-200">{selectedThreat.description}</p>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-slate-400">Location</label>
//                   <p className="font-medium">{selectedThreat.location.name}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm text-slate-400">Personnel Deployed</label>
//                   <p className="font-medium">{selectedThreat.personnel}</p>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-slate-400">Timestamp</label>
//                 <p className="font-medium">{selectedThreat.timestamp.toLocaleString()}</p>
//               </div>

//               <div className="flex space-x-3 mt-6">
//                 <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">
//                   Deploy Emergency Response
//                 </button>
//                 <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
//                   Request Backup
//                 </button>
//                 <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">
//                   Mark Investigating
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CommandCenter;

// THE ORIGINAL CODE GIVEN TO ME BY CLAUDE AI
// import { useState, useEffect, useRef } from 'react';
// import {
//   AlertTriangle,
//   Shield,
//   MapPin,
//   Camera,
//   Users,
//   Clock,
//   Volume2,
//   VolumeX,
//   Eye,
//   Zap,
//   Target,
//   Bell,
//   Activity
// } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';

// interface Sensor {
//   id: string;
//   name: string;
//   lat: number;
//   lng: number;
//   status: 'active' | 'inactive' | 'alert';
//   lastUpdate: Date;
//   batteryLevel: number;
// }

// interface Threat {
//   id: string;
//   sensorId: string;
//   type: 'intrusion' | 'suspicious_activity' | 'armed_group' | 'vehicle_movement';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   location: { lat: number; lng: number; name: string };
//   timestamp: Date;
//   description: string;
//   videoFeed?: string;
//   personnel: number;
//   status: 'active' | 'investigating' | 'resolved';
// }

// const CommandCenter = () => {
//   const [sensors, setSensors] = useState<Sensor[]>([]);
//   const [threats, setThreats] = useState<Threat[]>([]);
//   const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
//   const [soundEnabled, setSoundEnabled] = useState(true);
//   const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);

//   // Mock data for demonstration
//   useEffect(() => {
//     const mockSensors: Sensor[] = [
//       { id: 'S001', name: 'Makurdi Border North', lat: 7.7319, lng: 8.5211, status: 'active', lastUpdate: new Date(), batteryLevel: 85 },
//       { id: 'S002', name: 'Gboko Checkpoint', lat: 7.3239, lng: 9.0043, status: 'alert', lastUpdate: new Date(), batteryLevel: 92 },
//       { id: 'S003', name: 'Otukpo Border East', lat: 7.1905, lng: 8.1301, status: 'active', lastUpdate: new Date(), batteryLevel: 78 },
//       { id: 'S004', name: 'Katsina-Ala West', lat: 7.1667, lng: 9.2833, status: 'inactive', lastUpdate: new Date(Date.now() - 300000), batteryLevel: 45 },
//       { id: 'S005', name: 'Vandeikya South', lat: 6.7833, lng: 9.0667, status: 'active', lastUpdate: new Date(), batteryLevel: 95 },
//     ];

//     const mockThreats: Threat[] = [
//       {
//         id: 'T001',
//         sensorId: 'S002',
//         type: 'armed_group',
//         severity: 'critical',
//         location: { lat: 7.3239, lng: 9.0043, name: 'Gboko Checkpoint' },
//         timestamp: new Date(Date.now() - 120000),
//         description: 'Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.',
//         personnel: 10,
//         status: 'active'
//       },
//       {
//         id: 'T002',
//         sensorId: 'S001',
//         type: 'vehicle_movement',
//         severity: 'medium',
//         location: { lat: 7.7319, lng: 8.5211, name: 'Makurdi Border North' },
//         timestamp: new Date(Date.now() - 300000),
//         description: 'Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.',
//         personnel: 5,
//         status: 'investigating'
//       },
//       {
//         id: 'T003',
//         sensorId: 'S003',
//         type: 'intrusion',
//         severity: 'high',
//         location: { lat: 7.1905, lng: 8.1301, name: 'Otukpo Border East' },
//         timestamp: new Date(Date.now() - 600000),
//         description: 'Unauthorized border crossing detected. Multiple individuals attempting to bypass checkpoint.',
//         personnel: 6,
//         status: 'active'
//       }
//     ];

//     setSensors(mockSensors);
//     setThreats(mockThreats);
//   }, []);

//   // WebSocket connection simulation
//   useEffect(() => {
//     const connectWebSocket = () => {
//       setConnectionStatus('reconnecting');

//       // Simulate WebSocket connection
//       setTimeout(() => {
//         setConnectionStatus('connected');

//         // Simulate real-time updates
//         const interval = setInterval(() => {
//           const now = new Date();

//           // Update sensor data
//           setSensors(prev => prev.map(sensor => ({
//             ...sensor,
//             lastUpdate: now,
//             batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.5)
//           })));

//           // Occasionally add new threats
//           if (Math.random() < 0.1) {
//             const newThreat: Threat = {
//               id: `T${Date.now()}`,
//               sensorId: sensors[Math.floor(Math.random() * sensors.length)]?.id || 'S001',
//               type: ['intrusion', 'suspicious_activity', 'armed_group', 'vehicle_movement'][Math.floor(Math.random() * 4)] as Threat['type'],
//               severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as Threat["severity"],
//               location: { lat: 7 + Math.random(), lng: 8 + Math.random(), name: 'New Location' },
//               timestamp: now,
//               description: 'New threat detected by automated surveillance system.',
//               personnel: Math.floor(Math.random() * 15) + 1,
//               status: 'active'
//             };

//             setThreats(prev => [newThreat, ...prev.slice(0, 9)]);

//             // Play alert sound for critical threats
//             if (newThreat.severity === 'critical' && soundEnabled && audioRef.current) {
//               audioRef.current.play().catch(e => console.log('Audio play failed:', e));
//             }
//           }
//         }, 5000);

//         return () => clearInterval(interval);
//       }, 1000);
//     };

//     connectWebSocket();
//   }, [sensors, soundEnabled]);

//   const getSeverityColor = (severity: string) => {
//     switch (severity) {
//       case 'critical': return 'bg-red-600 text-white';
//       case 'high': return 'bg-red-500 text-white';
//       case 'medium': return 'bg-yellow-500 text-white';
//       case 'low': return 'bg-green-500 text-white';
//       default: return 'bg-gray-500 text-white';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'text-green-400';
//       case 'inactive': return 'text-red-400';
//       case 'alert': return 'text-orange-400';
//       default: return 'text-gray-400';
//     }
//   };

//   const activeCriticalThreats = threats.filter(t => t.severity === 'critical' && t.status === 'active');

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       {/* Audio element for alerts */}
//       <audio ref={audioRef} preload="auto">
//         <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y" type="audio/wav" />
//       </audio>

//       {/* Header */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Shield className="w-8 h-8 text-blue-400" />
//             <div>
//               <h1 className="text-2xl font-bold">Benue State Command Center</h1>
//               <p className="text-slate-400">Border Security & Threat Monitoring</p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
//               <span className="text-sm text-slate-400 capitalize">{connectionStatus}</span>
//             </div>

//             <button
//               onClick={() => setSoundEnabled(!soundEnabled)}
//               className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}
//             >
//               {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
//             </button>

//             <div className="text-right">
//               <div className="text-sm font-medium">{new Date().toLocaleTimeString()}</div>
//               <div className="text-xs text-slate-400">{new Date().toLocaleDateString()}</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Critical Alert Banner */}
//       {activeCriticalThreats.length > 0 && (
//         <div className="bg-red-600 text-white px-6 py-3 animate-pulse">
//           <div className="flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span className="font-semibold">
//               CRITICAL ALERT: {activeCriticalThreats.length} active critical threat{activeCriticalThreats.length > 1 ? 's' : ''} detected
//             </span>
//             <Bell className="w-5 h-5 animate-bounce" />
//           </div>
//         </div>
//       )}

//       <div className="flex flex-1">
//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//             {/* Statistics Cards */}
//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Sensors</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {sensors.filter(s => s.status === 'active').length}
//                   </p>
//                 </div>
//                 <Activity className="w-8 h-8 text-green-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Threats</p>
//                   <p className="text-2xl font-bold text-red-400">
//                     {threats.filter(t => t.status === 'active').length}
//                   </p>
//                 </div>
//                 <Target className="w-8 h-8 text-red-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Personnel Deployed</p>
//                   <p className="text-2xl font-bold text-blue-400">
//                     {threats.reduce((sum, t) => sum + t.personnel, 0)}
//                   </p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </div>
//           </div>

//           {/* Map Area */}
//           <div className="bg-slate-800 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-lg font-semibold flex items-center space-x-2">
//                 <MapPin className="w-5 h-5" />
//                 <span>Benue State Border Map</span>
//               </h2>
//               <div className="flex space-x-2">
//                 <div className="flex items-center space-x-1 text-sm text-green-400">
//                   <div className="w-3 h-3 bg-green-400 rounded-full"></div>
//                   <span>Active</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-red-400">
//                   <div className="w-3 h-3 bg-red-400 rounded-full"></div>
//                   <span>Threats</span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-slate-700 rounded-lg h-96 relative overflow-hidden">
//               {/* Simulated Map */}
//               <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800">
//                 <div className="absolute inset-4">
//                   {/* Sensor Points */}
//                   {sensors.map((sensor, index) => (
//                     <div
//                       key={sensor.id}
//                       className={`absolute w-4 h-4 rounded-full border-2 border-white animate-pulse cursor-pointer
//                         ${sensor.status === 'active' ? 'bg-green-400' :
//                           sensor.status === 'alert' ? 'bg-red-400' : 'bg-gray-400'}`}
//                       style={{
//                         left: `${20 + (index * 15)}%`,
//                         top: `${30 + (index * 10)}%`
//                       }}
//                       title={sensor.name}
//                     />
//                   ))}

//                   {/* Threat Indicators */}
//                   {threats.filter(t => t.status === 'active').map((threat, index) => (
//                     <div
//                       key={threat.id}
//                       className="absolute animate-ping cursor-pointer"
//                       style={{
//                         left: `${25 + (index * 20)}%`,
//                         top: `${40 + (index * 15)}%`
//                       }}
//                       onClick={() => setSelectedThreat(threat)}
//                     >
//                       <AlertTriangle className={`w-6 h-6 ${
//                         threat.severity === 'critical' ? 'text-red-500' :
//                         threat.severity === 'high' ? 'text-orange-500' :
//                         'text-yellow-500'
//                       }`} />
//                     </div>
//                   ))}
//                 </div>

//                 {/* Map Labels */}
//                 <div className="absolute top-4 left-4 text-xs text-slate-300">
//                   <div>Benue State</div>
//                   <div>Border Monitoring System</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Video Feeds */}
//           <div className="bg-slate-800 rounded-lg p-4">
//             <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//               <Camera className="w-5 h-5" />
//               <span>Live Video Feeds</span>
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {sensors.slice(0, 6).map((sensor) => (
//                 <div key={sensor.id} className="bg-slate-700 rounded-lg p-3">
//                   <div className="bg-black rounded aspect-video mb-2 flex items-center justify-center">
//                     <div className="text-slate-400 text-center">
//                       <Camera className="w-8 h-8 mx-auto mb-2" />
//                       <div className="text-xs">Camera {sensor.id}</div>
//                       <div className="text-xs">{sensor.name}</div>
//                     </div>
//                   </div>
//                   <div className="flex justify-between items-center text-xs">
//                     <span className={getStatusColor(sensor.status)}>{sensor.status}</span>
//                     <span className="text-slate-400">Battery: {sensor.batteryLevel}%</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Sidebar - Threat List */}
//         <div className="w-80 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span>Active Threats</span>
//           </h2>

//           <div className="space-y-3">
//             {threats.map((threat) => (
//               <div
//                 key={threat.id}
//                 className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-colors
//                   ${selectedThreat?.id === threat.id ? 'ring-2 ring-blue-400' : ''}
//                   hover:bg-slate-600`}
//                 onClick={() => setSelectedThreat(threat)}
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(threat.severity)}`}>
//                     {threat.severity.toUpperCase()}
//                   </span>
//                   <div className="flex items-center space-x-1 text-xs text-slate-400">
//                     <Clock className="w-3 h-3" />
//                     <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
//                   </div>
//                 </div>

//                 <h3 className="font-medium mb-1">{threat.type.replace('_', ' ').toUpperCase()}</h3>
//                 <p className="text-sm text-slate-300 mb-2">{threat.description}</p>

//                 <div className="flex items-center justify-between text-xs text-slate-400">
//                   <span className="flex items-center space-x-1">
//                     <MapPin className="w-3 h-3" />
//                     <span>{threat.location.name}</span>
//                   </span>
//                   <span className="flex items-center space-x-1">
//                     <Users className="w-3 h-3" />
//                     <span>{threat.personnel}</span>
//                   </span>
//                 </div>

//                 <div className="mt-2 flex space-x-2">
//                   <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
//                     Deploy
//                   </button>
//                   <button className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500">
//                     Investigate
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Sensor Status */}
//           <div className="mt-6">
//             <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
//               <Zap className="w-4 h-4" />
//               <span>Sensor Status</span>
//             </h3>

//             <div className="space-y-2">
//               {sensors.map((sensor) => (
//                 <div key={sensor.id} className="bg-slate-700 rounded p-2">
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm font-medium">{sensor.name}</span>
//                     <span className={`text-xs ${getStatusColor(sensor.status)}`}>
//                       {sensor.status}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between text-xs text-slate-400">
//                     <span>ID: {sensor.id}</span>
//                     <span>Battery: {sensor.batteryLevel.toFixed(1)}%</span>
//                   </div>
//                   <div className="w-full bg-slate-600 rounded-full h-1 mt-1">
//                     <div
//                       className="bg-green-400 h-1 rounded-full"
//                       style={{ width: `${sensor.batteryLevel}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Threat Detail Modal */}
//       {selectedThreat && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl font-bold">Threat Details</h2>
//               <button
//                 onClick={() => setSelectedThreat(null)}
//                 className="text-slate-400 hover:text-white"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-slate-400">Threat ID</label>
//                   <p className="font-medium">{selectedThreat.id}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm text-slate-400">Severity</label>
//                   <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getSeverityColor(selectedThreat.severity)}`}>
//                     {selectedThreat.severity.toUpperCase()}
//                   </span>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-slate-400">Description</label>
//                 <p className="text-slate-200">{selectedThreat.description}</p>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm text-slate-400">Location</label>
//                   <p className="font-medium">{selectedThreat.location.name}</p>
//                 </div>
//                 <div>
//                   <label className="text-sm text-slate-400">Personnel Deployed</label>
//                   <p className="font-medium">{selectedThreat.personnel}</p>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-slate-400">Timestamp</label>
//                 <p className="font-medium">{selectedThreat.timestamp.toLocaleString()}</p>
//               </div>

//               <div className="flex space-x-3 mt-6">
//                 <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">
//                   Deploy Emergency Response
//                 </button>
//                 <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
//                   Request Backup
//                 </button>
//                 <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">
//                   Mark Investigating
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CommandCenter;
