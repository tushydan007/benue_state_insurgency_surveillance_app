// // Enhanced Border Surveillance System with Real-Time Threat Detection and AI Integration
// import {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
//   Fragment,
// } from "react";
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
//   Target,
//   Bell,
//   Activity,
//   Navigation,
//   Radio,
//   Settings,
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Polyline,
//   Popup,
//   useMap,
//   Tooltip,
// } from "react-leaflet";
// import L, { type LatLngExpression } from "leaflet";
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
// import "leaflet/dist/leaflet.css";
// import benueBoundaryData from "@/data/benue1.geojson.json"; // Assume GeoJSON data for Benue state
// // import './EnhancedBorderSurveillance.css'; // Custom CSS for styling
// import * as tf from "@tensorflow/tfjs";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";

// // Types
// type SensorStatus = "active" | "inactive" | "alert" | "maintenance";
// type ThreatSeverity = "low" | "medium" | "high" | "critical";
// type ThreatType =
//   | "intrusion"
//   | "suspicious_activity"
//   | "armed_group"
//   | "vehicle_movement"
//   | "cyber_threat"
//   | "equipment_tampering";
// type ThreatStatus = "active" | "investigating" | "resolved" | "escalated";
// type ConnectionStatus = "connected" | "disconnected" | "reconnecting";
// type MovementDirection = "inbound" | "outbound" | "lateral" | "stationary";

// interface Coordinates {
//   lat: number;
//   lng: number;
// }

// interface LocationInfo extends Coordinates {
//   name: string;
// }

// interface Sensor {
//   id: string;
//   name: string;
//   coordinates: Coordinates;
//   status: SensorStatus;
//   lastUpdate: Date;
//   batteryLevel: number;
//   signalStrength: number;
//   sensorType: "motion" | "thermal" | "acoustic" | "camera" | "seismic";
// }

// interface ThreatMovement {
//   currentPosition: Coordinates;
//   previousPosition: Coordinates;
//   direction: MovementDirection;
//   speed: number; // km/h
//   trajectory: Coordinates[];
//   lastUpdate: Date;
// }

// interface Threat {
//   id: string;
//   sensorId: string;
//   type: ThreatType;
//   severity: ThreatSeverity;
//   location: LocationInfo;
//   timestamp: Date;
//   description: string;
//   personnel: number;
//   status: ThreatStatus;
//   movement: ThreatMovement;
//   estimatedSize: number;
//   confidence: number; // 0-100%
//   predictedPosition?: Coordinates;
// }

// // Constants
// const THREAT_TYPES: Record<ThreatType, { label: string; icon: string }> = {
//   intrusion: { label: "Border Intrusion", icon: "👥" },
//   suspicious_activity: { label: "Suspicious Activity", icon: "👁️" },
//   armed_group: { label: "Armed Group", icon: "⚔️" },
//   vehicle_movement: { label: "Vehicle Movement", icon: "🚗" },
//   cyber_threat: { label: "Cyber Threat", icon: "💻" },
//   equipment_tampering: { label: "Equipment Tampering", icon: "🔧" },
// };

// const SEVERITY_CONFIG: Record<
//   ThreatSeverity,
//   { color: string; bgColor: string; priority: number }
// > = {
//   low: { color: "text-green-400", bgColor: "bg-green-500", priority: 1 },
//   medium: { color: "text-yellow-400", bgColor: "bg-yellow-500", priority: 2 },
//   high: { color: "text-orange-400", bgColor: "bg-orange-500", priority: 3 },
//   critical: { color: "text-red-400", bgColor: "bg-red-500", priority: 4 },
// };

// // Custom Icons
// const sensorIcon = (status: SensorStatus) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       status === "active" ? "green" : status === "alert" ? "orange" : "red"
//     }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [16, 16],
//   });

// const threatIcon = (severity: ThreatSeverity) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       severity === "critical"
//         ? "red"
//         : severity === "high"
//         ? "orange"
//         : severity === "medium"
//         ? "yellow"
//         : "green"
//     }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [20, 20],
//   });

// const predictedIcon = L.divIcon({
//   className: "",
//   html: `<div style="background-color: gray; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; opacity: 0.7;"></div>`,
//   iconSize: [15, 15],
// });

// // Utility functions
// const isPointInPolygon = (point: Coordinates, polygon: number[][]): boolean => {
//   const { lat, lng } = point;
//   let inside = false;

//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const [xi, yi] = polygon[i];
//     const [xj, yj] = polygon[j];

//     if (
//       yi > lat !== yj > lat &&
//       lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
//     ) {
//       inside = !inside;
//     }
//   }

//   return inside;
// };

// const calculateDistance = (
//   point1: Coordinates,
//   point2: Coordinates
// ): number => {
//   const R = 6371; // Earth's radius in km
//   const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
//   const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((point1.lat * Math.PI) / 180) *
//       Math.cos((point2.lat * Math.PI) / 180) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const calculateBearing = (start: Coordinates, end: Coordinates): number => {
//   const dLng = ((end.lng - start.lng) * Math.PI) / 180;
//   const lat1 = (start.lat * Math.PI) / 180;
//   const lat2 = (end.lat * Math.PI) / 180;

//   const y = Math.sin(dLng) * Math.cos(lat2);
//   const x =
//     Math.cos(lat1) * Math.sin(lat2) -
//     Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

//   return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
// };

// const generateRandomPoint = (bounds: {
//   minLat: number;
//   maxLat: number;
//   minLng: number;
//   maxLng: number;
// }): Coordinates => ({
//   lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
//   lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng),
// });

// const movePointTowardTarget = (
//   current: Coordinates,
//   target: Coordinates,
//   speedKmH: number,
//   intervalMs: number
// ): Coordinates => {
//   const distance = calculateDistance(current, target);
//   const bearing = calculateBearing(current, target);

//   const movementKm = (speedKmH * intervalMs) / (1000 * 60 * 60);

//   if (distance <= movementKm) {
//     return target;
//   }

//   const bearingRad = (bearing * Math.PI) / 180;
//   const R = 6371; // Earth radius in km

//   const lat1 = (current.lat * Math.PI) / 180;
//   const lng1 = (current.lng * Math.PI) / 180;

//   const lat2 = Math.asin(
//     Math.sin(lat1) * Math.cos(movementKm / R) +
//       Math.cos(lat1) * Math.sin(movementKm / R) * Math.cos(bearingRad)
//   );

//   const lng2 =
//     lng1 +
//     Math.atan2(
//       Math.sin(bearingRad) * Math.sin(movementKm / R) * Math.cos(lat1),
//       Math.cos(movementKm / R) - Math.sin(lat1) * Math.sin(lat2)
//     );

//   return {
//     lat: (lat2 * 180) / Math.PI,
//     lng: (lng2 * 180) / Math.PI,
//   };
// };

// // Custom Map Controls
// const MapControls: React.FC<{
//   threats: Threat[];
//   showSensors: boolean;
//   setShowSensors: (val: boolean) => void;
//   showThreats: boolean;
//   setShowThreats: (val: boolean) => void;
//   showHeatmap: boolean;
//   setShowHeatmap: (val: boolean) => void;
// }> = ({
//   threats,
//   showSensors,
//   setShowSensors,
//   showThreats,
//   setShowThreats,
//   showHeatmap,
//   setShowHeatmap,
// }) => {
//   const map = useMap();

//   const zoomToThreats = useCallback(() => {
//     if (threats.length === 0) return;
//     const threatBounds = L.latLngBounds(
//       threats.map((t) => [
//         t.movement.currentPosition.lat,
//         t.movement.currentPosition.lng,
//       ])
//     );
//     map.fitBounds(threatBounds);
//   }, [map, threats]);

//   return (
//     <div className="leaflet-top leaflet-left bg-slate-800 rounded p-2 text-xs space-y-1 z-[1000] m-2">
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showSensors}
//           onChange={() => setShowSensors(!showSensors)}
//         />
//         <span>Sensors</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showThreats}
//           onChange={() => setShowThreats(!showThreats)}
//         />
//         <span>Threats</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showHeatmap}
//           onChange={() => setShowHeatmap(!showHeatmap)}
//         />
//         <span>Heatmap</span>
//       </div>
//       <button
//         onClick={zoomToThreats}
//         className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
//       >
//         Zoom to Threats
//       </button>
//     </div>
//   );
// };

// // Main Component
// const EnhancedBorderSurveillance: React.FC = () => {
//   const [sensors, setSensors] = useState<Sensor[]>([]);
//   const [threats, setThreats] = useState<Threat[]>([]);
//   const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
//   const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
//   const [connectionStatus, setConnectionStatus] =
//     useState<ConnectionStatus>("disconnected");
//   const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
//   const [notifications, setNotifications] = useState<
//     { id: string; message: string; severity: ThreatSeverity }[]
//   >([]);
//   const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
//   const [showSensors, setShowSensors] = useState(true);
//   const [showThreats, setShowThreats] = useState(true);
//   const [showHeatmap, setShowHeatmap] = useState(false);
//   const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
//   const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

//   const audioRef = useRef<HTMLAudioElement>(null);
//   const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
//     null
//   );
//   const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
//     null
//   );

//   const boundaryCoords = useMemo(() => {
//     const geometry = benueBoundaryData.features[0].geometry;
//     return geometry.type === "Polygon" ? geometry.coordinates[0] : [];
//   }, []);

//   const bounds = useMemo(
//     () => ({
//       minLat: 6.4,
//       maxLat: 8.1,
//       minLng: 7.8,
//       maxLng: 9.7,
//     }),
//     []
//   );

//   // Heatmap data
//   const heatmapData = useMemo(
//     () =>
//       threats.map((threat) => ({
//         lat: threat.movement.currentPosition.lat,
//         lng: threat.movement.currentPosition.lng,
//         value: SEVERITY_CONFIG[threat.severity].priority,
//       })),
//     [threats]
//   );

//   const generateNewThreatFromDetection = useCallback(
//     (sensorId: string, prediction: cocoSsd.DetectedObject): Threat | null => {
//       const sensor = sensors.find((s) => s.id === sensorId);
//       if (!sensor) return null;

//       let type: ThreatType = "suspicious_activity";
//       let severity: ThreatSeverity = "medium";
//       const description = `AI detected ${prediction.class} with ${Math.round(
//         prediction.score * 100
//       )}% confidence.`;

//       if (prediction.class === "person") {
//         type = "intrusion";
//         severity = "high";
//       } else if (["car", "truck"].includes(prediction.class)) {
//         type = "vehicle_movement";
//         severity = "medium";
//       }

//       const startPosition = {
//         lat: sensor.coordinates.lat + (Math.random() - 0.5) * 0.05,
//         lng: sensor.coordinates.lng + (Math.random() - 0.5) * 0.05,
//       };

//       return {
//         id: `T${Date.now()}`,
//         sensorId,
//         type,
//         severity,
//         location: {
//           ...startPosition,
//           name: `Near ${sensor.name}`,
//         },
//         timestamp: new Date(),
//         description,
//         personnel: 1,
//         status: "active",
//         movement: {
//           currentPosition: startPosition,
//           previousPosition: startPosition,
//           direction: "stationary",
//           speed: 0,
//           trajectory: [startPosition],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 1,
//         confidence: Math.round(prediction.score * 100),
//       };
//     },
//     [sensors]
//   );

//   // Load TensorFlow.js model
//   useEffect(() => {
//     const loadModel = async () => {
//       await tf.ready();
//       await tf.setBackend("webgl");
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   // AI Object Detection on Video Feeds
//   const runDetection = useCallback(
//     async (
//       video: HTMLVideoElement,
//       canvas: HTMLCanvasElement,
//       sensorId: string
//     ) => {
//       if (!model || !video || !canvas) return;

//       const predictions = await model.detect(video);

//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         predictions.forEach((prediction: cocoSsd.DetectedObject) => {
//           const [x, y, width, height] = prediction.bbox;
//           ctx.strokeStyle = "red";
//           ctx.lineWidth = 2;
//           ctx.strokeRect(x, y, width, height);
//           ctx.fillStyle = "red";
//           ctx.font = "12px Arial";
//           ctx.fillText(
//             `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//             x,
//             y > 10 ? y - 5 : y + 15
//           );
//         });
//       }

//       // Generate new threat based on detections
//       predictions.forEach((prediction: cocoSsd.DetectedObject) => {
//         if (
//           prediction.score > 0.5 &&
//           ["person", "car", "truck"].includes(prediction.class)
//         ) {
//           const newThreat = generateNewThreatFromDetection(
//             sensorId,
//             prediction
//           );
//           if (newThreat) {
//             setThreats((prev) => [newThreat, ...prev]);
//             setNotifications((prev) =>
//               [
//                 ...prev,
//                 {
//                   id: `${sensorId}-${Date.now()}`,
//                   message: `AI detected ${prediction.class} with ${Math.round(
//                     prediction.score * 100
//                   )}% confidence in ${sensorId}`,
//                   severity: "high" as ThreatSeverity,
//                 },
//               ].slice(-5)
//             );
//           }
//         }
//       });
//     },
//     [model, generateNewThreatFromDetection]
//   );

//   useEffect(() => {
//     if (model && isSimulationRunning) {
//       detectionIntervalRef.current = setInterval(() => {
//         sensors.forEach((sensor) => {
//           if (sensor.sensorType === "camera" && sensor.status === "active") {
//             const video = videoRefs.current[sensor.id];
//             const canvas = canvasRefs.current[sensor.id];
//             if (
//               video &&
//               canvas &&
//               video.readyState === video.HAVE_ENOUGH_DATA
//             ) {
//               canvas.width = video.videoWidth;
//               canvas.height = video.videoHeight;
//               runDetection(video, canvas, sensor.id);
//             }
//           }
//         });
//       }, 2000); // Optimized to every 2 seconds

//       return () => {
//         if (detectionIntervalRef.current)
//           clearInterval(detectionIntervalRef.current);
//       };
//     }
//   }, [model, isSimulationRunning, sensors, runDetection]);

//   // Initialize sensors
//   useEffect(() => {
//     const initialSensors: Sensor[] = [
//       {
//         id: "Makurdi Border North Sensor",
//         name: "Makurdi Border North",
//         coordinates: { lat: 7.7319, lng: 8.5211 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 85,
//         signalStrength: 92,
//         sensorType: "thermal",
//       },
//       {
//         id: "Gboko Checkpoint Sensor",
//         name: "Gboko Checkpoint",
//         coordinates: { lat: 7.3239, lng: 9.0043 },
//         status: "alert",
//         lastUpdate: new Date(),
//         batteryLevel: 92,
//         signalStrength: 88,
//         sensorType: "camera",
//       },
//       {
//         id: "Otukpo Border East Sensor",
//         name: "Otukpo Border East",
//         coordinates: { lat: 7.1905, lng: 8.1301 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 78,
//         signalStrength: 85,
//         sensorType: "motion",
//       },
//       {
//         id: "Katsina-Ala West Sensor",
//         name: "Katsina-Ala West",
//         coordinates: { lat: 7.1667, lng: 9.2833 },
//         status: "inactive",
//         lastUpdate: new Date(Date.now() - 300000),
//         batteryLevel: 45,
//         signalStrength: 0,
//         sensorType: "acoustic",
//       },
//       {
//         id: "Vandeikya South Sensor",
//         name: "Vandeikya South",
//         coordinates: { lat: 6.7833, lng: 9.0667 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 95,
//         signalStrength: 95,
//         sensorType: "seismic",
//       },
//     ];

//     setSensors(initialSensors);
//   }, []);

//   // Generate initial threats
//   useEffect(() => {
//     if (sensors.length === 0) return;

//     const initialThreats: Threat[] = [
//       {
//         id: "T001",
//         sensorId: "S002",
//         type: "armed_group",
//         severity: "critical",
//         location: {
//           lat: 7.2,
//           lng: 8.8,
//           name: "Border Perimeter North",
//         },
//         timestamp: new Date(Date.now() - 120000),
//         description:
//           "Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.",
//         personnel: 10,
//         status: "active",
//         movement: {
//           currentPosition: { lat: 7.2, lng: 8.8 },
//           previousPosition: { lat: 7.15, lng: 8.75 },
//           direction: "inbound",
//           speed: 3.5,
//           trajectory: [
//             { lat: 7.1, lng: 8.7 },
//             { lat: 7.15, lng: 8.75 },
//             { lat: 7.2, lng: 8.8 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 10,
//         confidence: 95,
//       },
//       {
//         id: "T002",
//         sensorId: "S001",
//         type: "vehicle_movement",
//         severity: "medium",
//         location: {
//           lat: 7.8,
//           lng: 8.2,
//           name: "Border Perimeter West",
//         },
//         timestamp: new Date(Date.now() - 300000),
//         description:
//           "Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.",
//         personnel: 6,
//         status: "investigating",
//         movement: {
//           currentPosition: { lat: 7.8, lng: 8.2 },
//           previousPosition: { lat: 7.85, lng: 8.15 },
//           direction: "outbound",
//           speed: 45,
//           trajectory: [
//             { lat: 7.9, lng: 8.1 },
//             { lat: 7.85, lng: 8.15 },
//             { lat: 7.8, lng: 8.2 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 6,
//         confidence: 82,
//       },
//     ];

//     setThreats(initialThreats);
//   }, [sensors]);

//   // Threat movement simulation with prediction
//   const updateThreatMovement = useCallback(() => {
//     setThreats((prevThreats) =>
//       prevThreats.map((threat) => {
//         if (threat.status !== "active") return threat;

//         const currentPos = threat.movement.currentPosition;
//         const isInside = isPointInPolygon(currentPos, boundaryCoords);

//         let newTarget: Coordinates;
//         let newDirection: MovementDirection;
//         let newSpeed = threat.movement.speed;

//         switch (threat.type) {
//           case "armed_group":
//             if (isInside) {
//               newTarget =
//                 Math.random() > 0.7
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "outbound";
//               newSpeed = 2 + Math.random() * 3;
//             } else {
//               newTarget =
//                 Math.random() > 0.5
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.1,
//                       maxLat: bounds.maxLat + 0.1,
//                       minLng: bounds.minLng - 0.1,
//                       maxLng: bounds.maxLng + 0.1,
//                     });
//               newDirection = "inbound";
//               newSpeed = 1.5 + Math.random() * 2.5;
//             }
//             break;

//           case "vehicle_movement":
//             if (isInside) {
//               newTarget = generateRandomPoint({
//                 minLat: bounds.minLat - 0.3,
//                 maxLat: bounds.maxLat + 0.3,
//                 minLng: bounds.minLng - 0.3,
//                 maxLng: bounds.maxLng + 0.3,
//               });
//               newDirection = "outbound";
//             } else {
//               newTarget =
//                 Math.random() > 0.6
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "inbound";
//             }
//             newSpeed = 25 + Math.random() * 35;
//             break;

//           default:
//             newTarget = generateRandomPoint({
//               minLat: bounds.minLat - 0.1,
//               maxLat: bounds.maxLat + 0.1,
//               minLng: bounds.minLng - 0.1,
//               maxLng: bounds.maxLng + 0.1,
//             });
//             newDirection = isInside ? "outbound" : "inbound";
//             newSpeed = 1 + Math.random() * 4;
//         }

//         const newPosition = movePointTowardTarget(
//           currentPos,
//           newTarget,
//           newSpeed,
//           3000
//         );
//         const predictedPosition = movePointTowardTarget(
//           newPosition,
//           newTarget,
//           newSpeed,
//           60000
//         ); // Predict 60 seconds ahead

//         return {
//           ...threat,
//           predictedPosition,
//           movement: {
//             currentPosition: newPosition,
//             previousPosition: currentPos,
//             direction: newDirection,
//             speed: newSpeed,
//             trajectory: [...threat.movement.trajectory.slice(-9), newPosition],
//             lastUpdate: new Date(),
//           },
//           location: {
//             ...threat.location,
//             lat: newPosition.lat,
//             lng: newPosition.lng,
//           },
//         };
//       })
//     );
//   }, [boundaryCoords, bounds]);

//   const generateNewThreat = useCallback((): Threat | null => {
//     if (sensors.length === 0) return null;

//     const threatTypes: ThreatType[] = [
//       "intrusion",
//       "suspicious_activity",
//       "vehicle_movement",
//       "armed_group",
//     ];
//     const severities: ThreatSeverity[] = ["low", "medium", "high", "critical"];
//     const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];

//     const startPosition =
//       Math.random() > 0.5
//         ? generateRandomPoint(bounds)
//         : generateRandomPoint({
//             minLat: bounds.minLat - 0.2,
//             maxLat: bounds.maxLat + 0.2,
//             minLng: bounds.minLng - 0.2,
//             maxLng: bounds.maxLng + 0.2,
//           });

//     const threat: Threat = {
//       id: `T${Date.now()}`,
//       sensorId: randomSensor.id,
//       type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
//       severity: severities[Math.floor(Math.random() * severities.length)],
//       location: {
//         lat: startPosition.lat,
//         lng: startPosition.lng,
//         name: "Auto-detected Threat",
//       },
//       timestamp: new Date(),
//       description: "Automated threat detection by surveillance system.",
//       personnel: Math.floor(Math.random() * 12) + 1,
//       status: "active",
//       movement: {
//         currentPosition: startPosition,
//         previousPosition: startPosition,
//         direction: "stationary",
//         speed: 0,
//         trajectory: [startPosition],
//         lastUpdate: new Date(),
//       },
//       estimatedSize: Math.floor(Math.random() * 15) + 1,
//       confidence: Math.floor(Math.random() * 40) + 60,
//     };

//     if (
//       ["high", "critical"].includes(threat.severity) &&
//       soundEnabled &&
//       audioRef.current
//     ) {
//       audioRef.current.play().catch(console.error);
//       setNotifications((prev) =>
//         [
//           ...prev,
//           {
//             id: threat.id,
//             message: `New ${threat.severity.toUpperCase()} threat detected: ${
//               THREAT_TYPES[threat.type].label
//             }`,
//             severity: threat.severity,
//           },
//         ].slice(-5)
//       );
//     }

//     return threat;
//   }, [sensors, bounds, soundEnabled]);

//   // Simulation loop
//   useEffect(() => {
//     if (!isSimulationRunning) return;

//     setConnectionStatus("connected");

//     simulationIntervalRef.current = setInterval(() => {
//       setSensors((prev) =>
//         prev.map((sensor) => ({
//           ...sensor,
//           lastUpdate: new Date(),
//           batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.1),
//           signalStrength: Math.max(
//             0,
//             Math.min(100, sensor.signalStrength + (Math.random() - 0.5) * 5)
//           ),
//         }))
//       );

//       updateThreatMovement();

//       if (Math.random() < 0.05) {
//         const newThreat = generateNewThreat();
//         if (newThreat) {
//           setThreats((prev) => [newThreat, ...prev.slice(0, 19)]);
//         }
//       }

//       setThreats((prev) =>
//         prev.filter(
//           (threat) =>
//             threat.status !== "resolved" ||
//             Date.now() - threat.timestamp.getTime() < 300000
//         )
//       );
//     }, 3000);

//     return () => {
//       if (simulationIntervalRef.current) {
//         clearInterval(simulationIntervalRef.current);
//       }
//     };
//   }, [isSimulationRunning, updateThreatMovement, generateNewThreat, sensors]);

//   // Auto-dismiss notifications
//   useEffect(() => {
//     if (notifications.length > 0) {
//       const timer = setTimeout(() => {
//         setNotifications((prev) => prev.slice(1));
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [notifications]);

//   const getSeverityColor = (severity: ThreatSeverity): string => {
//     return `${SEVERITY_CONFIG[severity].bgColor} text-white`;
//   };

//   const getStatusColor = (status: SensorStatus): string => {
//     const colorMap: Record<SensorStatus, string> = {
//       active: "text-green-400",
//       inactive: "text-red-400",
//       alert: "text-orange-400",
//       maintenance: "text-yellow-400",
//     };
//     return colorMap[status];
//   };

//   const getMovementIcon = (direction: MovementDirection): string => {
//     const icons: Record<MovementDirection, string> = {
//       inbound: "↗️",
//       outbound: "↙️",
//       lateral: "↔️",
//       stationary: "⏹️",
//     };
//     return icons[direction];
//   };

//   const activeCriticalThreats = useMemo(
//     () =>
//       threats.filter((t) => t.severity === "critical" && t.status === "active"),
//     [threats]
//   );

//   const activeThreats = useMemo(
//     () => threats.filter((t) => t.status === "active"),
//     [threats]
//   );

//   const activeSensors = useMemo(
//     () => sensors.filter((s) => s.status === "active"),
//     [sensors]
//   );

//   return (
//     <div className="min-h-screen bg-slate-900 text-white relative">
//       {/* Audio element for alerts */}
//       <audio ref={audioRef} preload="auto">
//         <source
//           src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y"
//           type="audio/wav"
//         />
//       </audio>

//       {/* In-app notifications */}
//       <div className="absolute top-20 right-4 z-20 space-y-2">
//         {notifications.map((notif) => (
//           <div
//             key={notif.id}
//             className={`p-4 rounded shadow-lg text-white transform transition-all duration-300 ease-in-out animate-slide-in ${
//               notif.severity === "critical" ? "bg-red-600" : "bg-orange-600"
//             }`}
//           >
//             {notif.message}
//           </div>
//         ))}
//       </div>

//       {/* Header */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Shield className="w-8 h-8 text-blue-400" />
//             <div>
//               <h1 className="text-2xl font-bold">
//                 Enhanced Border Surveillance
//               </h1>
//               <p className="text-slate-400">
//                 Benue State - Real-time Threat Tracking
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div
//                 className={`w-3 h-3 rounded-full ${
//                   connectionStatus === "connected"
//                     ? "bg-green-400 animate-pulse"
//                     : "bg-red-400"
//                 }`}
//               />
//               <span className="text-sm text-slate-400 capitalize">
//                 {connectionStatus}
//               </span>
//             </div>

//             <button
//               onClick={() => setIsSimulationRunning(!isSimulationRunning)}
//               className={`px-3 py-1 rounded text-sm ${
//                 isSimulationRunning
//                   ? "bg-red-600 hover:bg-red-500"
//                   : "bg-green-600 hover:bg-green-500"
//               }`}
//             >
//               {isSimulationRunning ? "Stop Sim" : "Start Sim"}
//             </button>

//             <button
//               onClick={() => setSoundEnabled(!soundEnabled)}
//               className={`p-2 rounded-lg ${
//                 soundEnabled
//                   ? "bg-blue-600 text-white"
//                   : "bg-slate-600 text-slate-300"
//               }`}
//             >
//               {soundEnabled ? (
//                 <Volume2 className="w-5 h-5" />
//               ) : (
//                 <VolumeX className="w-5 h-5" />
//               )}
//             </button>

//             <div className="text-right">
//               <div className="text-sm font-medium">
//                 {new Date().toLocaleTimeString()}
//               </div>
//               <div className="text-xs text-slate-400">
//                 {new Date().toLocaleDateString()}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Critical Alert Banner */}
//       {activeCriticalThreats.length > 0 && (
//         <Alert className="px-6 py-3 bg-red-900 border-red-700 text-red-100 animate-pulse">
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold">
//                 CRITICAL ALERT: {activeCriticalThreats.length} active critical
//                 threat
//                 {activeCriticalThreats.length > 1 ? "s" : ""} detected
//               </span>
//               <Bell className="w-5 h-5 animate-bounce" />
//             </div>
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="flex flex-1">
//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           {/* Statistics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Sensors</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {activeSensors.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     of {sensors.length} total
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
//                     {activeThreats.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     {activeCriticalThreats.length} critical
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
//                   <p className="text-xs text-slate-500">across all threats</p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">System Status</p>
//                   <p className="text-lg font-bold text-green-400">
//                     Operational
//                   </p>
//                   <p className="text-xs text-slate-500">All systems normal</p>
//                 </div>
//                 <Settings className="w-8 h-8 text-green-400" />
//               </div>
//             </div>
//           </div>

//           {/* Map */}
//           <div className="bg-slate-800 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-lg font-semibold flex items-center space-x-2">
//                 <MapPin className="w-5 h-5" />
//                 <span>Benue State Border Map - Live Tracking</span>
//               </h2>
//               <div className="flex space-x-4">
//                 <div className="flex items-center space-x-1 text-sm text-blue-400">
//                   <div className="w-3 h-3 bg-blue-400 rounded"></div>
//                   <span>Sensors</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-red-400">
//                   <div className="w-3 h-3 bg-red-400 rounded-full"></div>
//                   <span>Active Threats</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-purple-400">
//                   <Navigation className="w-3 h-3" />
//                   <span>Movement Trails</span>
//                 </div>
//               </div>
//             </div>

//             {/* Real Map with Leaflet */}
//             <div className="bg-slate-900 rounded-lg h-[850px] relative overflow-hidden border border-slate-600">
//               <MapContainer
//                 center={[7.5, 8.5]}
//                 zoom={9}
//                 style={{ height: "100%", width: "100%" }}
//                 maxBounds={[
//                   [bounds.minLat - 0.5, bounds.minLng - 0.5],
//                   [bounds.maxLat + 0.5, bounds.maxLng + 0.5],
//                 ]}
//               >
//                 <TileLayer
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 />
//                 <Polygon
//                   positions={boundaryCoords.map(
//                     ([lng, lat]) => [lat, lng] as LatLngExpression
//                   )}
//                   pathOptions={{ color: "blue", dashArray: "5, 5" }}
//                 />
//                 <MapControls
//                   threats={threats}
//                   showSensors={showSensors}
//                   setShowSensors={setShowSensors}
//                   showThreats={showThreats}
//                   setShowThreats={setShowThreats}
//                   showHeatmap={showHeatmap}
//                   setShowHeatmap={setShowHeatmap}
//                 />
//                 {showSensors && (
//                   <MarkerClusterGroup>
//                     {sensors.map((sensor) => (
//                       <Marker
//                         key={sensor.id}
//                         position={[
//                           sensor.coordinates.lat,
//                           sensor.coordinates.lng,
//                         ]}
//                         icon={sensorIcon(sensor.status)}
//                       >
//                         <Popup>
//                           {sensor.name} - {sensor.status}
//                         </Popup>
//                         <Tooltip>{sensor.id}</Tooltip>
//                       </Marker>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showThreats && (
//                   <MarkerClusterGroup>
//                     {activeThreats.map((threat) => (
//                       <Fragment key={threat.id}>
//                         <Marker
//                           position={[
//                             threat.movement.currentPosition.lat,
//                             threat.movement.currentPosition.lng,
//                           ]}
//                           icon={threatIcon(threat.severity)}
//                           eventHandlers={{
//                             click: () => setSelectedThreat(threat),
//                           }}
//                         >
//                           <Popup>
//                             {THREAT_TYPES[threat.type].label}
//                             <br />
//                             Severity: {threat.severity}
//                             <br />
//                             Speed: {threat.movement.speed.toFixed(1)} km/h
//                           </Popup>
//                           <Tooltip direction="top">
//                             {THREAT_TYPES[threat.type].label}
//                           </Tooltip>
//                         </Marker>
//                         {threat.movement.trajectory.length > 1 && (
//                           <Polyline
//                             positions={threat.movement.trajectory.map(
//                               (pos) => [pos.lat, pos.lng] as LatLngExpression
//                             )}
//                             pathOptions={{ color: "purple", dashArray: "2,2" }}
//                           />
//                         )}
//                         {threat.predictedPosition && (
//                           <>
//                             <Polyline
//                               positions={
//                                 [
//                                   [
//                                     threat.movement.currentPosition.lat,
//                                     threat.movement.currentPosition.lng,
//                                   ],
//                                   [
//                                     threat.predictedPosition.lat,
//                                     threat.predictedPosition.lng,
//                                   ],
//                                 ] as LatLngExpression[]
//                               }
//                               pathOptions={{
//                                 color: "gray",
//                                 dashArray: "5,5",
//                                 opacity: 0.7,
//                               }}
//                             />
//                             <Marker
//                               position={[
//                                 threat.predictedPosition.lat,
//                                 threat.predictedPosition.lng,
//                               ]}
//                               icon={predictedIcon}
//                             >
//                               <Popup>Predicted Position (60s ahead)</Popup>
//                               <Tooltip>Predicted</Tooltip>
//                             </Marker>
//                           </>
//                         )}
//                       </Fragment>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showHeatmap && (
//                   <HeatmapLayer
//                     points={
//                       heatmapData as Array<{
//                         lat: number;
//                         lng: number;
//                         value: number;
//                       }>
//                     }
//                     longitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lng}
//                     latitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lat}
//                     intensityExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.value}
//                     radius={20}
//                     blur={15}
//                     maxZoom={18}
//                   />
//                 )}
//               </MapContainer>

//               {/* Simulation indicator */}
//               <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-800 rounded px-3 py-1 border border-slate-600 z-[1000]">
//                 <div
//                   className={`w-2 h-2 rounded-full ${
//                     isSimulationRunning
//                       ? "bg-green-400 animate-pulse"
//                       : "bg-red-400"
//                   }`}
//                 ></div>
//                 <span className="text-xs">
//                   {isSimulationRunning
//                     ? "Live Simulation"
//                     : "Simulation Paused"}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Video Feeds */}
//           <div className="bg-slate-800 rounded-lg p-4">
//             <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//               <Camera className="w-5 h-5" />
//               <span>Live Video Feeds & Sensor Data (with AI Detection)</span>
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {sensors.map((sensor) => (
//                 <div
//                   key={sensor.id}
//                   className="bg-slate-700 rounded-lg p-3 border border-slate-600"
//                 >
//                   <div className="bg-black rounded aspect-video mb-3 relative overflow-hidden">
//                     <video
//                       ref={(el) => {
//                         videoRefs.current[sensor.id] = el;
//                       }}
//                       autoPlay
//                       loop
//                       muted
//                       playsInline
//                       className="w-full h-full object-cover absolute top-0 left-0"
//                     >
//                       <source
//                         src="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s.mp4"
//                         type="video/mp4"
//                       />
//                     </video>
//                     <canvas
//                       ref={(el) => {
//                         canvasRefs.current[sensor.id] = el;
//                       }}
//                       className="absolute top-0 left-0 pointer-events-none"
//                     />
//                     <div className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
//                       {sensor.sensorType.toUpperCase()} - {sensor.id}
//                     </div>
//                     {isSimulationRunning && (
//                       <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//                     )}
//                     {sensor.status === "alert" && (
//                       <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
//                     )}
//                   </div>

//                   <div className="space-y-2">
//                     <div className="flex justify-between items-center text-sm">
//                       <span className="text-slate-300">{sensor.name}</span>
//                       <span className={getStatusColor(sensor.status)}>
//                         {sensor.status.toUpperCase()}
//                       </span>
//                     </div>

//                     <div className="grid grid-cols-2 gap-2 text-xs">
//                       <div className="bg-slate-600 rounded p-1">
//                         <div className="text-slate-400">Battery</div>
//                         <div className="font-medium">
//                           {sensor.batteryLevel.toFixed(1)}%
//                         </div>
//                         <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
//                           <div
//                             className={`h-1 rounded-full ${
//                               sensor.batteryLevel > 50
//                                 ? "bg-green-400"
//                                 : sensor.batteryLevel > 25
//                                 ? "bg-yellow-400"
//                                 : "bg-red-400"
//                             }`}
//                             style={{ width: `${sensor.batteryLevel}%` }}
//                           />
//                         </div>
//                       </div>

//                       <div className="bg-slate-600 rounded p-1">
//                         <div className="text-slate-400">Signal</div>
//                         <div className="font-medium">
//                           {sensor.signalStrength.toFixed(0)}%
//                         </div>
//                         <div className="flex space-x-1 mt-1">
//                           {[1, 2, 3, 4, 5].map((bar) => (
//                             <div
//                               key={bar}
//                               className={`flex-1 h-1 rounded ${
//                                 sensor.signalStrength >= bar * 20
//                                   ? "bg-green-400"
//                                   : "bg-slate-800"
//                               }`}
//                             />
//                           ))}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="text-xs text-slate-400">
//                       Last update: {sensor.lastUpdate.toLocaleTimeString()}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Enhanced Sidebar */}
//         <div className="w-96 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span>Threat Intelligence</span>
//           </h2>

//           {/* Threat Filter */}
//           <div className="mb-4 space-y-2">
//             <div className="flex space-x-1 text-xs">
//               <button className="px-2 py-1 bg-red-600 text-white rounded">
//                 Critical
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 High
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 Medium
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 All
//               </button>
//             </div>
//           </div>

//           {/* Threat List */}
//           <div
//             className="space-y-3 mb-6"
//             style={{ maxHeight: "50vh", overflowY: "auto" }}
//           >
//             {threats
//               .sort(
//                 (a, b) =>
//                   SEVERITY_CONFIG[b.severity].priority -
//                   SEVERITY_CONFIG[a.severity].priority
//               )
//               .map((threat) => (
//                 <div
//                   key={threat.id}
//                   className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-all border
//                     ${
//                       selectedThreat?.id === threat.id
//                         ? "ring-2 ring-blue-400 border-blue-400"
//                         : "border-slate-600"
//                     }
//                     hover:bg-slate-600 hover:border-slate-500`}
//                   onClick={() => setSelectedThreat(threat)}
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       <span
//                         className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
//                           threat.severity
//                         )}`}
//                       >
//                         {threat.severity.toUpperCase()}
//                       </span>
//                       <span className="text-xs">
//                         {THREAT_TYPES[threat.type].icon}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-1 text-xs text-slate-400">
//                       <Clock className="w-3 h-3" />
//                       <span>
//                         {new Date(threat.timestamp).toLocaleTimeString()}
//                       </span>
//                     </div>
//                   </div>

//                   <h3 className="font-medium mb-1 text-sm">
//                     {THREAT_TYPES[threat.type].label}
//                   </h3>

//                   <p className="text-xs text-slate-300 mb-2 line-clamp-2">
//                     {threat.description}
//                   </p>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
//                     <span className="flex items-center space-x-1">
//                       <Navigation className="w-3 h-3" />
//                       <span>{threat.movement.direction}</span>
//                       <span>{getMovementIcon(threat.movement.direction)}</span>
//                     </span>
//                     <span>{threat.movement.speed.toFixed(1)} km/h</span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
//                     <span className="flex items-center space-x-1">
//                       <MapPin className="w-3 h-3" />
//                       <span>{threat.location.name}</span>
//                     </span>
//                     <span className="flex items-center space-x-1">
//                       <Users className="w-3 h-3" />
//                       <span>{threat.personnel}</span>
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs mb-2">
//                     <span className="text-slate-400">
//                       Confidence: {threat.confidence}%
//                     </span>
//                     <span
//                       className={`px-1 rounded ${
//                         threat.status === "active"
//                           ? "bg-red-800 text-red-200"
//                           : threat.status === "investigating"
//                           ? "bg-yellow-800 text-yellow-200"
//                           : "bg-green-800 text-green-200"
//                       }`}
//                     >
//                       {threat.status.toUpperCase()}
//                     </span>
//                   </div>

//                   <div className="flex space-x-1">
//                     <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 flex-1">
//                       Deploy
//                     </button>
//                     <button className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 flex-1">
//                       Investigate
//                     </button>
//                   </div>
//                 </div>
//               ))}
//           </div>

//           {/* System Status Panel */}
//           <div className="border-t border-slate-600 pt-4">
//             <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
//               <Radio className="w-4 h-4" />
//               <span>System Status</span>
//             </h3>

//             <div className="space-y-3">
//               <div className="bg-slate-700 rounded p-3">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm font-medium">Network Status</span>
//                   <span
//                     className={`text-xs px-2 py-1 rounded ${
//                       connectionStatus === "connected"
//                         ? "bg-green-800 text-green-200"
//                         : "bg-red-800 text-red-200"
//                     }`}
//                   >
//                     {connectionStatus.toUpperCase()}
//                   </span>
//                 </div>
//                 <div className="text-xs text-slate-400">
//                   Uptime: 99.8% | Latency: 12ms
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Sensor Network</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-green-400">Active:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "active").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">Alert:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "alert").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Offline:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "inactive").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Threat Analysis</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Critical:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "critical" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">High:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) => t.severity === "high" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-yellow-400">Medium:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "medium" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-slate-400">Resolved:</span>
//                     <span>
//                       {threats.filter((t) => t.status === "resolved").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Threat Detail Modal */}
//       {selectedThreat && (
//         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center space-x-3">
//                 <h2 className="text-xl font-bold">
//                   Threat Intelligence Report
//                 </h2>
//                 <span
//                   className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(
//                     selectedThreat.severity
//                   )}`}
//                 >
//                   {selectedThreat.severity.toUpperCase()}
//                 </span>
//               </div>
//               <button
//                 onClick={() => setSelectedThreat(null)}
//                 className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Basic Information
//                   </h3>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <label className="text-slate-400">Threat ID</label>
//                       <p className="font-medium">{selectedThreat.id}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Sensor ID</label>
//                       <p className="font-medium">{selectedThreat.sensorId}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Type</label>
//                       <p className="font-medium">
//                         {THREAT_TYPES[selectedThreat.type].icon}{" "}
//                         {THREAT_TYPES[selectedThreat.type].label}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Status</label>
//                       <p
//                         className={`font-medium ${
//                           selectedThreat.status === "active"
//                             ? "text-red-400"
//                             : selectedThreat.status === "investigating"
//                             ? "text-yellow-400"
//                             : "text-green-400"
//                         }`}
//                       >
//                         {selectedThreat.status.toUpperCase()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Movement Analysis
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Direction:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.direction}{" "}
//                         {getMovementIcon(selectedThreat.movement.direction)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Current Speed:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.speed.toFixed(1)} km/h
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Estimated Size:</span>
//                       <span className="font-medium">
//                         {selectedThreat.estimatedSize} individuals
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Confidence:</span>
//                       <span className="font-medium">
//                         {selectedThreat.confidence}%
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Threat Description
//                   </h3>
//                   <p className="text-slate-200 text-sm leading-relaxed">
//                     {selectedThreat.description}
//                   </p>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Location & Time
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div>
//                       <label className="text-slate-400">Location</label>
//                       <p className="font-medium">
//                         {selectedThreat.location.name}
//                       </p>
//                       <p className="text-xs text-slate-500">
//                         {selectedThreat.location.lat.toFixed(4)},{" "}
//                         {selectedThreat.location.lng.toFixed(4)}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">First Detected</label>
//                       <p className="font-medium">
//                         {selectedThreat.timestamp.toLocaleString()}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Last Update</label>
//                       <p className="font-medium">
//                         {selectedThreat.movement.lastUpdate.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-600">
//               <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center space-x-2">
//                 <AlertTriangle className="w-4 h-4" />
//                 <span>Deploy Emergency Response</span>
//               </button>
//               <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center space-x-2">
//                 <Users className="w-4 h-4" />
//                 <span>Request Backup</span>
//               </button>
//               <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 flex items-center space-x-2">
//                 <Eye className="w-4 h-4" />
//                 <span>Mark Investigating</span>
//               </button>
//               <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
//                 Mark Resolved
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EnhancedBorderSurveillance;



// Enhanced Border Surveillance System with Real-Time Threat Detection and AI Integration BY GROK I LOVE
// import {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
//   Fragment,
// } from "react";
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
//   Target,
//   Bell,
//   Activity,
//   Navigation,
//   Radio,
//   Settings,
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Polyline,
//   Popup,
//   useMap,
//   Tooltip,
// } from "react-leaflet";
// import L, { type LatLngExpression } from "leaflet";
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
// import "leaflet/dist/leaflet.css";
// import benueBoundaryData from "@/data/benue1.geojson.json"; // Assume GeoJSON data for Benue state
// // import './EnhancedBorderSurveillance.css'; // Custom CSS for styling
// import * as tf from "@tensorflow/tfjs";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";

// // Types
// type SensorStatus = "active" | "inactive" | "alert" | "maintenance";
// type ThreatSeverity = "low" | "medium" | "high" | "critical";
// type ThreatType =
//   | "intrusion"
//   | "suspicious_activity"
//   | "armed_group"
//   | "vehicle_movement"
//   | "cyber_threat"
//   | "equipment_tampering";
// type ThreatStatus = "active" | "investigating" | "resolved" | "escalated";
// type ConnectionStatus = "connected" | "disconnected" | "reconnecting";
// type MovementDirection = "inbound" | "outbound" | "lateral" | "stationary";

// interface Coordinates {
//   lat: number;
//   lng: number;
// }

// interface LocationInfo extends Coordinates {
//   name: string;
// }

// interface Sensor {
//   id: string;
//   name: string;
//   coordinates: Coordinates;
//   status: SensorStatus;
//   lastUpdate: Date;
//   batteryLevel: number;
//   signalStrength: number;
//   sensorType: "motion" | "thermal" | "acoustic" | "camera" | "seismic";
// }

// interface ThreatMovement {
//   currentPosition: Coordinates;
//   previousPosition: Coordinates;
//   direction: MovementDirection;
//   speed: number; // km/h
//   trajectory: Coordinates[];
//   lastUpdate: Date;
// }

// interface Threat {
//   id: string;
//   sensorId: string;
//   type: ThreatType;
//   severity: ThreatSeverity;
//   location: LocationInfo;
//   timestamp: Date;
//   description: string;
//   personnel: number;
//   status: ThreatStatus;
//   movement: ThreatMovement;
//   estimatedSize: number;
//   confidence: number; // 0-100%
//   predictedPosition?: Coordinates;
// }

// // Constants
// const THREAT_TYPES: Record<ThreatType, { label: string; icon: string }> = {
//   intrusion: { label: "Border Intrusion", icon: "👥" },
//   suspicious_activity: { label: "Suspicious Activity", icon: "👁️" },
//   armed_group: { label: "Armed Group", icon: "⚔️" },
//   vehicle_movement: { label: "Vehicle Movement", icon: "🚗" },
//   cyber_threat: { label: "Cyber Threat", icon: "💻" },
//   equipment_tampering: { label: "Equipment Tampering", icon: "🔧" },
// };

// const SEVERITY_CONFIG: Record<
//   ThreatSeverity,
//   { color: string; bgColor: string; priority: number }
// > = {
//   low: { color: "text-green-400", bgColor: "bg-green-500", priority: 1 },
//   medium: { color: "text-yellow-400", bgColor: "bg-yellow-500", priority: 2 },
//   high: { color: "text-orange-400", bgColor: "bg-orange-500", priority: 3 },
//   critical: { color: "text-red-400", bgColor: "bg-red-500", priority: 4 },
// };

// // Simulated video sources for stakeholder demo - different scenes to showcase variety in surveillance feeds
// const VIDEO_SOURCES: Record<string, string> = {
//   "Makurdi Border North Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Animated scene with movement (simulates wildlife/intrusion)
//   "Gboko Checkpoint Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", // Car driving on street/dirt (vehicle movement)
//   "Otukpo Border East Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", // Animated with characters (person-like detection)
//   "Katsina-Ala West Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4", // Car review (vehicles and people)
//   "Vandeikya South Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4", // Car shopping (multiple vehicles, people)
// };

// // Custom Icons
// const sensorIcon = (status: SensorStatus) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       status === "active" ? "green" : status === "alert" ? "orange" : "red"
//     }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [16, 16],
//   });

// const threatIcon = (severity: ThreatSeverity) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       severity === "critical"
//         ? "red"
//         : severity === "high"
//         ? "orange"
//         : severity === "medium"
//         ? "yellow"
//         : "green"
//     }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [20, 20],
//   });

// const predictedIcon = L.divIcon({
//   className: "",
//   html: `<div style="background-color: gray; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; opacity: 0.7;"></div>`,
//   iconSize: [15, 15],
// });

// // Utility functions
// const isPointInPolygon = (point: Coordinates, polygon: number[][]): boolean => {
//   const { lat, lng } = point;
//   let inside = false;

//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const [xi, yi] = polygon[i];
//     const [xj, yj] = polygon[j];

//     if (
//       yi > lat !== yj > lat &&
//       lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
//     ) {
//       inside = !inside;
//     }
//   }

//   return inside;
// };

// const calculateDistance = (
//   point1: Coordinates,
//   point2: Coordinates
// ): number => {
//   const R = 6371; // Earth's radius in km
//   const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
//   const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((point1.lat * Math.PI) / 180) *
//       Math.cos((point2.lat * Math.PI) / 180) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const calculateBearing = (start: Coordinates, end: Coordinates): number => {
//   const dLng = ((end.lng - start.lng) * Math.PI) / 180;
//   const lat1 = (start.lat * Math.PI) / 180;
//   const lat2 = (end.lat * Math.PI) / 180;

//   const y = Math.sin(dLng) * Math.cos(lat2);
//   const x =
//     Math.cos(lat1) * Math.sin(lat2) -
//     Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

//   return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
// };

// const generateRandomPoint = (bounds: {
//   minLat: number;
//   maxLat: number;
//   minLng: number;
//   maxLng: number;
// }): Coordinates => ({
//   lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
//   lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng),
// });

// const movePointTowardTarget = (
//   current: Coordinates,
//   target: Coordinates,
//   speedKmH: number,
//   intervalMs: number
// ): Coordinates => {
//   const distance = calculateDistance(current, target);
//   const bearing = calculateBearing(current, target);

//   const movementKm = (speedKmH * intervalMs) / (1000 * 60 * 60);

//   if (distance <= movementKm) {
//     return target;
//   }

//   const bearingRad = (bearing * Math.PI) / 180;
//   const R = 6371; // Earth radius in km

//   const lat1 = (current.lat * Math.PI) / 180;
//   const lng1 = (current.lng * Math.PI) / 180;

//   const lat2 = Math.asin(
//     Math.sin(lat1) * Math.cos(movementKm / R) +
//       Math.cos(lat1) * Math.sin(movementKm / R) * Math.cos(bearingRad)
//   );

//   const lng2 =
//     lng1 +
//     Math.atan2(
//       Math.sin(bearingRad) * Math.sin(movementKm / R) * Math.cos(lat1),
//       Math.cos(movementKm / R) - Math.sin(lat1) * Math.sin(lat2)
//     );

//   return {
//     lat: (lat2 * 180) / Math.PI,
//     lng: (lng2 * 180) / Math.PI,
//   };
// };

// // Custom Map Controls
// const MapControls: React.FC<{
//   threats: Threat[];
//   showSensors: boolean;
//   setShowSensors: (val: boolean) => void;
//   showThreats: boolean;
//   setShowThreats: (val: boolean) => void;
//   showHeatmap: boolean;
//   setShowHeatmap: (val: boolean) => void;
// }> = ({
//   threats,
//   showSensors,
//   setShowSensors,
//   showThreats,
//   setShowThreats,
//   showHeatmap,
//   setShowHeatmap,
// }) => {
//   const map = useMap();

//   const zoomToThreats = useCallback(() => {
//     if (threats.length === 0) return;
//     const threatBounds = L.latLngBounds(
//       threats.map((t) => [
//         t.movement.currentPosition.lat,
//         t.movement.currentPosition.lng,
//       ])
//     );
//     map.fitBounds(threatBounds);
//   }, [map, threats]);

//   return (
//     <div className="leaflet-top leaflet-left bg-slate-800 rounded p-2 text-xs space-y-1 z-[1000] m-2">
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showSensors}
//           onChange={() => setShowSensors(!showSensors)}
//         />
//         <span>Sensors</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showThreats}
//           onChange={() => setShowThreats(!showThreats)}
//         />
//         <span>Threats</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showHeatmap}
//           onChange={() => setShowHeatmap(!showHeatmap)}
//         />
//         <span>Heatmap</span>
//       </div>
//       <button
//         onClick={zoomToThreats}
//         className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
//       >
//         Zoom to Threats
//       </button>
//     </div>
//   );
// };

// // Main Component
// const EnhancedBorderSurveillance: React.FC = () => {
//   const [sensors, setSensors] = useState<Sensor[]>([]);
//   const [threats, setThreats] = useState<Threat[]>([]);
//   const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
//   const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
//   const [connectionStatus, setConnectionStatus] =
//     useState<ConnectionStatus>("disconnected");
//   const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
//   const [notifications, setNotifications] = useState<
//     { id: string; message: string; severity: ThreatSeverity }[]
//   >([]);
//   const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
//   const [showSensors, setShowSensors] = useState(true);
//   const [showThreats, setShowThreats] = useState(true);
//   const [showHeatmap, setShowHeatmap] = useState(false);
//   const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
//   const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

//   const audioRef = useRef<HTMLAudioElement>(null);
//   const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
//     null
//   );
//   const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
//     null
//   );

//   const boundaryCoords = useMemo(() => {
//     const geometry = benueBoundaryData.features[0].geometry;
//     return geometry.type === "Polygon" ? geometry.coordinates[0] : [];
//   }, []);

//   const bounds = useMemo(
//     () => ({
//       minLat: 6.4,
//       maxLat: 8.1,
//       minLng: 7.8,
//       maxLng: 9.7,
//     }),
//     []
//   );

//   // Heatmap data
//   const heatmapData = useMemo(
//     () =>
//       threats.map((threat) => ({
//         lat: threat.movement.currentPosition.lat,
//         lng: threat.movement.currentPosition.lng,
//         value: SEVERITY_CONFIG[threat.severity].priority,
//       })),
//     [threats]
//   );

//   const generateNewThreatFromDetection = useCallback(
//     (sensorId: string, prediction: cocoSsd.DetectedObject): Threat | null => {
//       const sensor = sensors.find((s) => s.id === sensorId);
//       if (!sensor) return null;

//       let type: ThreatType = "suspicious_activity";
//       let severity: ThreatSeverity = "medium";
//       const description = `AI detected ${prediction.class} with ${Math.round(
//         prediction.score * 100
//       )}% confidence.`;

//       if (prediction.class === "person") {
//         type = "intrusion";
//         severity = "high";
//       } else if (["car", "truck"].includes(prediction.class)) {
//         type = "vehicle_movement";
//         severity = "medium";
//       }

//       const startPosition = {
//         lat: sensor.coordinates.lat + (Math.random() - 0.5) * 0.05,
//         lng: sensor.coordinates.lng + (Math.random() - 0.5) * 0.05,
//       };

//       return {
//         id: `T${Date.now()}`,
//         sensorId,
//         type,
//         severity,
//         location: {
//           ...startPosition,
//           name: `Near ${sensor.name}`,
//         },
//         timestamp: new Date(),
//         description,
//         personnel: 1,
//         status: "active",
//         movement: {
//           currentPosition: startPosition,
//           previousPosition: startPosition,
//           direction: "stationary",
//           speed: 0,
//           trajectory: [startPosition],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 1,
//         confidence: Math.round(prediction.score * 100),
//       };
//     },
//     [sensors]
//   );

//   // Load TensorFlow.js model
//   useEffect(() => {
//     const loadModel = async () => {
//       await tf.ready();
//       await tf.setBackend("webgl");
//       const loadedModel = await cocoSsd.load();
//       setModel(loadedModel);
//     };
//     loadModel();
//   }, []);

//   // AI Object Detection on Video Feeds
//   const runDetection = useCallback(
//     async (
//       video: HTMLVideoElement,
//       canvas: HTMLCanvasElement,
//       sensorId: string
//     ) => {
//       if (!model || !video || !canvas) return;

//       const predictions = await model.detect(video);

//       const ctx = canvas.getContext("2d");
//       if (ctx) {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         predictions.forEach((prediction: cocoSsd.DetectedObject) => {
//           const [x, y, width, height] = prediction.bbox;
//           ctx.strokeStyle = "red";
//           ctx.lineWidth = 2;
//           ctx.strokeRect(x, y, width, height);
//           ctx.fillStyle = "red";
//           ctx.font = "12px Arial";
//           ctx.fillText(
//             `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
//             x,
//             y > 10 ? y - 5 : y + 15
//           );
//         });
//       }

//       // Generate new threat based on detections
//       predictions.forEach((prediction: cocoSsd.DetectedObject) => {
//         if (
//           prediction.score > 0.5 &&
//           ["person", "car", "truck", "bicycle", "motorcycle"].includes(prediction.class)
//         ) {
//           const newThreat = generateNewThreatFromDetection(
//             sensorId,
//             prediction
//           );
//           if (newThreat) {
//             setThreats((prev) => [newThreat, ...prev]);
//             setNotifications((prev) =>
//               [
//                 ...prev,
//                 {
//                   id: `${sensorId}-${Date.now()}`,
//                   message: `AI detected ${prediction.class} with ${Math.round(
//                     prediction.score * 100
//                   )}% confidence in ${sensorId}`,
//                   severity: "high" as ThreatSeverity,
//                 },
//               ].slice(-5)
//             );
//           }
//         }
//       });
//     },
//     [model, generateNewThreatFromDetection]
//   );

//   useEffect(() => {
//     if (model && isSimulationRunning) {
//       detectionIntervalRef.current = setInterval(() => {
//         sensors.forEach((sensor) => {
//           if (sensor.sensorType === "camera" && sensor.status === "active") {
//             const video = videoRefs.current[sensor.id];
//             const canvas = canvasRefs.current[sensor.id];
//             if (
//               video &&
//               canvas &&
//               video.readyState === video.HAVE_ENOUGH_DATA
//             ) {
//               canvas.width = video.videoWidth;
//               canvas.height = video.videoHeight;
//               runDetection(video, canvas, sensor.id);
//             }
//           }
//         });
//       }, 2000); // Optimized to every 2 seconds

//       return () => {
//         if (detectionIntervalRef.current)
//           clearInterval(detectionIntervalRef.current);
//       };
//     }
//   }, [model, isSimulationRunning, sensors, runDetection]);

//   // Initialize sensors
//   useEffect(() => {
//     const initialSensors: Sensor[] = [
//       {
//         id: "Makurdi Border North Sensor",
//         name: "Makurdi Border North",
//         coordinates: { lat: 7.7319, lng: 8.5211 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 85,
//         signalStrength: 92,
//         sensorType: "thermal",
//       },
//       {
//         id: "Gboko Checkpoint Sensor",
//         name: "Gboko Checkpoint",
//         coordinates: { lat: 7.3239, lng: 9.0043 },
//         status: "alert",
//         lastUpdate: new Date(),
//         batteryLevel: 92,
//         signalStrength: 88,
//         sensorType: "camera",
//       },
//       {
//         id: "Otukpo Border East Sensor",
//         name: "Otukpo Border East",
//         coordinates: { lat: 7.1905, lng: 8.1301 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 78,
//         signalStrength: 85,
//         sensorType: "motion",
//       },
//       {
//         id: "Katsina-Ala West Sensor",
//         name: "Katsina-Ala West",
//         coordinates: { lat: 7.1667, lng: 9.2833 },
//         status: "inactive",
//         lastUpdate: new Date(Date.now() - 300000),
//         batteryLevel: 45,
//         signalStrength: 0,
//         sensorType: "acoustic",
//       },
//       {
//         id: "Vandeikya South Sensor",
//         name: "Vandeikya South",
//         coordinates: { lat: 6.7833, lng: 9.0667 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 95,
//         signalStrength: 95,
//         sensorType: "seismic",
//       },
//     ];

//     setSensors(initialSensors);
//   }, []);

//   // Generate initial threats
//   useEffect(() => {
//     if (sensors.length === 0) return;

//     const initialThreats: Threat[] = [
//       {
//         id: "T001",
//         sensorId: "S002",
//         type: "armed_group",
//         severity: "critical",
//         location: {
//           lat: 7.2,
//           lng: 8.8,
//           name: "Border Perimeter North",
//         },
//         timestamp: new Date(Date.now() - 120000),
//         description:
//           "Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.",
//         personnel: 10,
//         status: "active",
//         movement: {
//           currentPosition: { lat: 7.2, lng: 8.8 },
//           previousPosition: { lat: 7.15, lng: 8.75 },
//           direction: "inbound",
//           speed: 3.5,
//           trajectory: [
//             { lat: 7.1, lng: 8.7 },
//             { lat: 7.15, lng: 8.75 },
//             { lat: 7.2, lng: 8.8 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 10,
//         confidence: 95,
//       },
//       {
//         id: "T002",
//         sensorId: "S001",
//         type: "vehicle_movement",
//         severity: "medium",
//         location: {
//           lat: 7.8,
//           lng: 8.2,
//           name: "Border Perimeter West",
//         },
//         timestamp: new Date(Date.now() - 300000),
//         description:
//           "Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.",
//         personnel: 6,
//         status: "investigating",
//         movement: {
//           currentPosition: { lat: 7.8, lng: 8.2 },
//           previousPosition: { lat: 7.85, lng: 8.15 },
//           direction: "outbound",
//           speed: 45,
//           trajectory: [
//             { lat: 7.9, lng: 8.1 },
//             { lat: 7.85, lng: 8.15 },
//             { lat: 7.8, lng: 8.2 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 6,
//         confidence: 82,
//       },
//     ];

//     setThreats(initialThreats);
//   }, [sensors]);

//   // Threat movement simulation with prediction
//   const updateThreatMovement = useCallback(() => {
//     setThreats((prevThreats) =>
//       prevThreats.map((threat) => {
//         if (threat.status !== "active") return threat;

//         const currentPos = threat.movement.currentPosition;
//         const isInside = isPointInPolygon(currentPos, boundaryCoords);

//         let newTarget: Coordinates;
//         let newDirection: MovementDirection;
//         let newSpeed = threat.movement.speed;

//         switch (threat.type) {
//           case "armed_group":
//             if (isInside) {
//               newTarget =
//                 Math.random() > 0.7
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "outbound";
//               newSpeed = 2 + Math.random() * 3;
//             } else {
//               newTarget =
//                 Math.random() > 0.5
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.1,
//                       maxLat: bounds.maxLat + 0.1,
//                       minLng: bounds.minLng - 0.1,
//                       maxLng: bounds.maxLng + 0.1,
//                     });
//               newDirection = "inbound";
//               newSpeed = 1.5 + Math.random() * 2.5;
//             }
//             break;

//           case "vehicle_movement":
//             if (isInside) {
//               newTarget = generateRandomPoint({
//                 minLat: bounds.minLat - 0.3,
//                 maxLat: bounds.maxLat + 0.3,
//                 minLng: bounds.minLng - 0.3,
//                 maxLng: bounds.maxLng + 0.3,
//               });
//               newDirection = "outbound";
//             } else {
//               newTarget =
//                 Math.random() > 0.6
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "inbound";
//             }
//             newSpeed = 25 + Math.random() * 35;
//             break;

//           default:
//             newTarget = generateRandomPoint({
//               minLat: bounds.minLat - 0.1,
//               maxLat: bounds.maxLat + 0.1,
//               minLng: bounds.minLng - 0.1,
//               maxLng: bounds.maxLng + 0.1,
//             });
//             newDirection = isInside ? "outbound" : "inbound";
//             newSpeed = 1 + Math.random() * 4;
//         }

//         const newPosition = movePointTowardTarget(
//           currentPos,
//           newTarget,
//           newSpeed,
//           3000
//         );
//         const predictedPosition = movePointTowardTarget(
//           newPosition,
//           newTarget,
//           newSpeed,
//           60000
//         ); // Predict 60 seconds ahead

//         return {
//           ...threat,
//           predictedPosition,
//           movement: {
//             currentPosition: newPosition,
//             previousPosition: currentPos,
//             direction: newDirection,
//             speed: newSpeed,
//             trajectory: [...threat.movement.trajectory.slice(-9), newPosition],
//             lastUpdate: new Date(),
//           },
//           location: {
//             ...threat.location,
//             lat: newPosition.lat,
//             lng: newPosition.lng,
//           },
//         };
//       })
//     );
//   }, [boundaryCoords, bounds]);

//   const generateNewThreat = useCallback((): Threat | null => {
//     if (sensors.length === 0) return null;

//     const threatTypes: ThreatType[] = [
//       "intrusion",
//       "suspicious_activity",
//       "vehicle_movement",
//       "armed_group",
//     ];
//     const severities: ThreatSeverity[] = ["low", "medium", "high", "critical"];
//     const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];

//     const startPosition =
//       Math.random() > 0.5
//         ? generateRandomPoint(bounds)
//         : generateRandomPoint({
//             minLat: bounds.minLat - 0.2,
//             maxLat: bounds.maxLat + 0.2,
//             minLng: bounds.minLng - 0.2,
//             maxLng: bounds.maxLng + 0.2,
//           });

//     const threat: Threat = {
//       id: `T${Date.now()}`,
//       sensorId: randomSensor.id,
//       type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
//       severity: severities[Math.floor(Math.random() * severities.length)],
//       location: {
//         lat: startPosition.lat,
//         lng: startPosition.lng,
//         name: "Auto-detected Threat",
//       },
//       timestamp: new Date(),
//       description: "Automated threat detection by surveillance system.",
//       personnel: Math.floor(Math.random() * 12) + 1,
//       status: "active",
//       movement: {
//         currentPosition: startPosition,
//         previousPosition: startPosition,
//         direction: "stationary",
//         speed: 0,
//         trajectory: [startPosition],
//         lastUpdate: new Date(),
//       },
//       estimatedSize: Math.floor(Math.random() * 15) + 1,
//       confidence: Math.floor(Math.random() * 40) + 60,
//     };

//     if (
//       ["high", "critical"].includes(threat.severity) &&
//       soundEnabled &&
//       audioRef.current
//     ) {
//       audioRef.current.play().catch(console.error);
//       setNotifications((prev) =>
//         [
//           ...prev,
//           {
//             id: threat.id,
//             message: `New ${threat.severity.toUpperCase()} threat detected: ${
//               THREAT_TYPES[threat.type].label
//             }`,
//             severity: threat.severity,
//           },
//         ].slice(-5)
//       );
//     }

//     return threat;
//   }, [sensors, bounds, soundEnabled]);

//   // Simulation loop
//   useEffect(() => {
//     if (!isSimulationRunning) return;

//     setConnectionStatus("connected");

//     simulationIntervalRef.current = setInterval(() => {
//       setSensors((prev) =>
//         prev.map((sensor) => ({
//           ...sensor,
//           lastUpdate: new Date(),
//           batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.1),
//           signalStrength: Math.max(
//             0,
//             Math.min(100, sensor.signalStrength + (Math.random() - 0.5) * 5)
//           ),
//         }))
//       );

//       updateThreatMovement();

//       if (Math.random() < 0.05) {
//         const newThreat = generateNewThreat();
//         if (newThreat) {
//           setThreats((prev) => [newThreat, ...prev.slice(0, 19)]);
//         }
//       }

//       setThreats((prev) =>
//         prev.filter(
//           (threat) =>
//             threat.status !== "resolved" ||
//             Date.now() - threat.timestamp.getTime() < 300000
//         )
//       );
//     }, 3000);

//     return () => {
//       if (simulationIntervalRef.current) {
//         clearInterval(simulationIntervalRef.current);
//       }
//     };
//   }, [isSimulationRunning, updateThreatMovement, generateNewThreat, sensors]);

//   // Auto-dismiss notifications
//   useEffect(() => {
//     if (notifications.length > 0) {
//       const timer = setTimeout(() => {
//         setNotifications((prev) => prev.slice(1));
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [notifications]);

//   const getSeverityColor = (severity: ThreatSeverity): string => {
//     return `${SEVERITY_CONFIG[severity].bgColor} text-white`;
//   };

//   const getStatusColor = (status: SensorStatus): string => {
//     const colorMap: Record<SensorStatus, string> = {
//       active: "text-green-400",
//       inactive: "text-red-400",
//       alert: "text-orange-400",
//       maintenance: "text-yellow-400",
//     };
//     return colorMap[status];
//   };

//   const getMovementIcon = (direction: MovementDirection): string => {
//     const icons: Record<MovementDirection, string> = {
//       inbound: "↗️",
//       outbound: "↙️",
//       lateral: "↔️",
//       stationary: "⏹️",
//     };
//     return icons[direction];
//   };

//   const activeCriticalThreats = useMemo(
//     () =>
//       threats.filter((t) => t.severity === "critical" && t.status === "active"),
//     [threats]
//   );

//   const activeThreats = useMemo(
//     () => threats.filter((t) => t.status === "active"),
//     [threats]
//   );

//   const activeSensors = useMemo(
//     () => sensors.filter((s) => s.status === "active"),
//     [sensors]
//   );

//   return (
//     <div className="min-h-screen bg-slate-900 text-white relative">
//       {/* Audio element for alerts */}
//       <audio ref={audioRef} preload="auto">
//         <source
//           src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y"
//           type="audio/wav"
//         />
//       </audio>

//       {/* In-app notifications */}
//       <div className="absolute top-20 right-4 z-20 space-y-2">
//         {notifications.map((notif) => (
//           <div
//             key={notif.id}
//             className={`p-4 rounded shadow-lg text-white transform transition-all duration-300 ease-in-out animate-slide-in ${
//               notif.severity === "critical" ? "bg-red-600" : "bg-orange-600"
//             }`}
//           >
//             {notif.message}
//           </div>
//         ))}
//       </div>

//       {/* Header */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Shield className="w-8 h-8 text-blue-400" />
//             <div>
//               <h1 className="text-2xl font-bold">
//                 Enhanced Border Surveillance
//               </h1>
//               <p className="text-slate-400">
//                 Benue State - Real-time Threat Tracking
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div
//                 className={`w-3 h-3 rounded-full ${
//                   connectionStatus === "connected"
//                     ? "bg-green-400 animate-pulse"
//                     : "bg-red-400"
//                 }`}
//               />
//               <span className="text-sm text-slate-400 capitalize">
//                 {connectionStatus}
//               </span>
//             </div>

//             <button
//               onClick={() => setIsSimulationRunning(!isSimulationRunning)}
//               className={`px-3 py-1 rounded text-sm ${
//                 isSimulationRunning
//                   ? "bg-red-600 hover:bg-red-500"
//                   : "bg-green-600 hover:bg-green-500"
//               }`}
//             >
//               {isSimulationRunning ? "Stop Sim" : "Start Sim"}
//             </button>

//             <button
//               onClick={() => setSoundEnabled(!soundEnabled)}
//               className={`p-2 rounded-lg ${
//                 soundEnabled
//                   ? "bg-blue-600 text-white"
//                   : "bg-slate-600 text-slate-300"
//               }`}
//             >
//               {soundEnabled ? (
//                 <Volume2 className="w-5 h-5" />
//               ) : (
//                 <VolumeX className="w-5 h-5" />
//               )}
//             </button>

//             <div className="text-right">
//               <div className="text-sm font-medium">
//                 {new Date().toLocaleTimeString()}
//               </div>
//               <div className="text-xs text-slate-400">
//                 {new Date().toLocaleDateString()}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Critical Alert Banner */}
//       {activeCriticalThreats.length > 0 && (
//         <Alert className="px-6 py-3 bg-red-900 border-red-700 text-red-100 animate-pulse">
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold">
//                 CRITICAL ALERT: {activeCriticalThreats.length} active critical
//                 threat
//                 {activeCriticalThreats.length > 1 ? "s" : ""} detected
//               </span>
//               <Bell className="w-5 h-5 animate-bounce" />
//             </div>
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="flex flex-1">
//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           {/* Statistics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Sensors</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {activeSensors.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     of {sensors.length} total
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
//                     {activeThreats.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     {activeCriticalThreats.length} critical
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
//                   <p className="text-xs text-slate-500">across all threats</p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">System Status</p>
//                   <p className="text-lg font-bold text-green-400">
//                     Operational
//                   </p>
//                   <p className="text-xs text-slate-500">All systems normal</p>
//                 </div>
//                 <Settings className="w-8 h-8 text-green-400" />
//               </div>
//             </div>
//           </div>

//           {/* Map */}
//           <div className="bg-slate-800 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-lg font-semibold flex items-center space-x-2">
//                 <MapPin className="w-5 h-5" />
//                 <span>Benue State Border Map - Live Tracking</span>
//               </h2>
//               <div className="flex space-x-4">
//                 <div className="flex items-center space-x-1 text-sm text-blue-400">
//                   <div className="w-3 h-3 bg-blue-400 rounded"></div>
//                   <span>Sensors</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-red-400">
//                   <div className="w-3 h-3 bg-red-400 rounded-full"></div>
//                   <span>Active Threats</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-purple-400">
//                   <Navigation className="w-3 h-3" />
//                   <span>Movement Trails</span>
//                 </div>
//               </div>
//             </div>

//             {/* Real Map with Leaflet */}
//             <div className="bg-slate-900 rounded-lg h-[850px] relative overflow-hidden border border-slate-600">
//               <MapContainer
//                 center={[7.5, 8.5]}
//                 zoom={9}
//                 style={{ height: "100%", width: "100%" }}
//                 maxBounds={[
//                   [bounds.minLat - 0.5, bounds.minLng - 0.5],
//                   [bounds.maxLat + 0.5, bounds.maxLng + 0.5],
//                 ]}
//               >
//                 <TileLayer
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 />
//                 <Polygon
//                   positions={boundaryCoords.map(
//                     ([lng, lat]) => [lat, lng] as LatLngExpression
//                   )}
//                   pathOptions={{ color: "blue", dashArray: "5, 5" }}
//                 />
//                 <MapControls
//                   threats={threats}
//                   showSensors={showSensors}
//                   setShowSensors={setShowSensors}
//                   showThreats={showThreats}
//                   setShowThreats={setShowThreats}
//                   showHeatmap={showHeatmap}
//                   setShowHeatmap={setShowHeatmap}
//                 />
//                 {showSensors && (
//                   <MarkerClusterGroup>
//                     {sensors.map((sensor) => (
//                       <Marker
//                         key={sensor.id}
//                         position={[
//                           sensor.coordinates.lat,
//                           sensor.coordinates.lng,
//                         ]}
//                         icon={sensorIcon(sensor.status)}
//                       >
//                         <Popup>
//                           {sensor.name} - {sensor.status}
//                         </Popup>
//                         <Tooltip>{sensor.id}</Tooltip>
//                       </Marker>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showThreats && (
//                   <MarkerClusterGroup>
//                     {activeThreats.map((threat) => (
//                       <Fragment key={threat.id}>
//                         <Marker
//                           position={[
//                             threat.movement.currentPosition.lat,
//                             threat.movement.currentPosition.lng,
//                           ]}
//                           icon={threatIcon(threat.severity)}
//                           eventHandlers={{
//                             click: () => setSelectedThreat(threat),
//                           }}
//                         >
//                           <Popup>
//                             {THREAT_TYPES[threat.type].label}
//                             <br />
//                             Severity: {threat.severity}
//                             <br />
//                             Speed: {threat.movement.speed.toFixed(1)} km/h
//                           </Popup>
//                           <Tooltip direction="top">
//                             {THREAT_TYPES[threat.type].label}
//                           </Tooltip>
//                         </Marker>
//                         {threat.movement.trajectory.length > 1 && (
//                           <Polyline
//                             positions={threat.movement.trajectory.map(
//                               (pos) => [pos.lat, pos.lng] as LatLngExpression
//                             )}
//                             pathOptions={{ color: "purple", dashArray: "2,2" }}
//                           />
//                         )}
//                         {threat.predictedPosition && (
//                           <>
//                             <Polyline
//                               positions={
//                                 [
//                                   [
//                                     threat.movement.currentPosition.lat,
//                                     threat.movement.currentPosition.lng,
//                                   ],
//                                   [
//                                     threat.predictedPosition.lat,
//                                     threat.predictedPosition.lng,
//                                   ],
//                                 ] as LatLngExpression[]
//                               }
//                               pathOptions={{
//                                 color: "gray",
//                                 dashArray: "5,5",
//                                 opacity: 0.7,
//                               }}
//                             />
//                             <Marker
//                               position={[
//                                 threat.predictedPosition.lat,
//                                 threat.predictedPosition.lng,
//                               ]}
//                               icon={predictedIcon}
//                             >
//                               <Popup>Predicted Position (60s ahead)</Popup>
//                               <Tooltip>Predicted</Tooltip>
//                             </Marker>
//                           </>
//                         )}
//                       </Fragment>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showHeatmap && (
//                   <HeatmapLayer
//                     points={
//                       heatmapData as Array<{
//                         lat: number;
//                         lng: number;
//                         value: number;
//                       }>
//                     }
//                     longitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lng}
//                     latitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lat}
//                     intensityExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.value}
//                     radius={20}
//                     blur={15}
//                     maxZoom={18}
//                   />
//                 )}
//               </MapContainer>

//               {/* Simulation indicator */}
//               <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-800 rounded px-3 py-1 border border-slate-600 z-[1000]">
//                 <div
//                   className={`w-2 h-2 rounded-full ${
//                     isSimulationRunning
//                       ? "bg-green-400 animate-pulse"
//                       : "bg-red-400"
//                   }`}
//                 ></div>
//                 <span className="text-xs">
//                   {isSimulationRunning
//                     ? "Live Simulation"
//                     : "Simulation Paused"}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Video Feeds */}
//           <div className="bg-slate-800 rounded-lg p-4">
//             <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//               <Camera className="w-5 h-5" />
//               <span>Live Video Feeds & Sensor Data (with AI Detection)</span>
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {sensors.map((sensor) => {
//                 const videoSrc = VIDEO_SOURCES[sensor.id] || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; // Fallback
//                 return (
//                   <div
//                     key={sensor.id}
//                     className="bg-slate-700 rounded-lg p-3 border border-slate-600"
//                   >
//                     <div className="bg-black rounded aspect-video mb-3 relative overflow-hidden">
//                       <video
//                         ref={(el) => {
//                           videoRefs.current[sensor.id] = el;
//                         }}
//                         autoPlay
//                         loop
//                         muted
//                         playsInline
//                         className="w-full h-full object-cover absolute top-0 left-0"
//                       >
//                         <source
//                           src={videoSrc}
//                           type="video/mp4"
//                         />
//                       </video>
//                       <canvas
//                         ref={(el) => {
//                           canvasRefs.current[sensor.id] = el;
//                         }}
//                         className="absolute top-0 left-0 pointer-events-none"
//                       />
//                       <div className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
//                         {sensor.sensorType.toUpperCase()} - {sensor.id}
//                       </div>
//                       {isSimulationRunning && (
//                         <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//                       )}
//                       {sensor.status === "alert" && (
//                         <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
//                       )}
//                     </div>

//                     <div className="space-y-2">
//                       <div className="flex justify-between items-center text-sm">
//                         <span className="text-slate-300">{sensor.name}</span>
//                         <span className={getStatusColor(sensor.status)}>
//                           {sensor.status.toUpperCase()}
//                         </span>
//                       </div>

//                       <div className="grid grid-cols-2 gap-2 text-xs">
//                         <div className="bg-slate-600 rounded p-1">
//                           <div className="text-slate-400">Battery</div>
//                           <div className="font-medium">
//                             {sensor.batteryLevel.toFixed(1)}%
//                           </div>
//                           <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
//                             <div
//                               className={`h-1 rounded-full ${
//                                 sensor.batteryLevel > 50
//                                   ? "bg-green-400"
//                                   : sensor.batteryLevel > 25
//                                   ? "bg-yellow-400"
//                                   : "bg-red-400"
//                               }`}
//                               style={{ width: `${sensor.batteryLevel}%` }}
//                             />
//                           </div>
//                         </div>

//                         <div className="bg-slate-600 rounded p-1">
//                           <div className="text-slate-400">Signal</div>
//                           <div className="font-medium">
//                             {sensor.signalStrength.toFixed(0)}%
//                           </div>
//                           <div className="flex space-x-1 mt-1">
//                             {[1, 2, 3, 4, 5].map((bar) => (
//                               <div
//                                 key={bar}
//                                 className={`flex-1 h-1 rounded ${
//                                   sensor.signalStrength >= bar * 20
//                                     ? "bg-green-400"
//                                     : "bg-slate-800"
//                                 }`}
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="text-xs text-slate-400">
//                         Last update: {sensor.lastUpdate.toLocaleTimeString()}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Enhanced Sidebar */}
//         <div className="w-96 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span>Threat Intelligence</span>
//           </h2>

//           {/* Threat Filter */}
//           <div className="mb-4 space-y-2">
//             <div className="flex space-x-1 text-xs">
//               <button className="px-2 py-1 bg-red-600 text-white rounded">
//                 Critical
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 High
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 Medium
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500">
//                 All
//               </button>
//             </div>
//           </div>

//           {/* Threat List */}
//           <div
//             className="space-y-3 mb-6"
//             style={{ maxHeight: "50vh", overflowY: "auto" }}
//           >
//             {threats
//               .sort(
//                 (a, b) =>
//                   SEVERITY_CONFIG[b.severity].priority -
//                   SEVERITY_CONFIG[a.severity].priority
//               )
//               .map((threat) => (
//                 <div
//                   key={threat.id}
//                   className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-all border
//                     ${
//                       selectedThreat?.id === threat.id
//                         ? "ring-2 ring-blue-400 border-blue-400"
//                         : "border-slate-600"
//                     }
//                     hover:bg-slate-600 hover:border-slate-500`}
//                   onClick={() => setSelectedThreat(threat)}
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       <span
//                         className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
//                           threat.severity
//                         )}`}
//                       >
//                         {threat.severity.toUpperCase()}
//                       </span>
//                       <span className="text-xs">
//                         {THREAT_TYPES[threat.type].icon}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-1 text-xs text-slate-400">
//                       <Clock className="w-3 h-3" />
//                       <span>
//                         {new Date(threat.timestamp).toLocaleTimeString()}
//                       </span>
//                     </div>
//                   </div>

//                   <h3 className="font-medium mb-1 text-sm">
//                     {THREAT_TYPES[threat.type].label}
//                   </h3>

//                   <p className="text-xs text-slate-300 mb-2 line-clamp-2">
//                     {threat.description}
//                   </p>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
//                     <span className="flex items-center space-x-1">
//                       <Navigation className="w-3 h-3" />
//                       <span>{threat.movement.direction}</span>
//                       <span>{getMovementIcon(threat.movement.direction)}</span>
//                     </span>
//                     <span>{threat.movement.speed.toFixed(1)} km/h</span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
//                     <span className="flex items-center space-x-1">
//                       <MapPin className="w-3 h-3" />
//                       <span>{threat.location.name}</span>
//                     </span>
//                     <span className="flex items-center space-x-1">
//                       <Users className="w-3 h-3" />
//                       <span>{threat.personnel}</span>
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs mb-2">
//                     <span className="text-slate-400">
//                       Confidence: {threat.confidence}%
//                     </span>
//                     <span
//                       className={`px-1 rounded ${
//                         threat.status === "active"
//                           ? "bg-red-800 text-red-200"
//                           : threat.status === "investigating"
//                           ? "bg-yellow-800 text-yellow-200"
//                           : "bg-green-800 text-green-200"
//                       }`}
//                     >
//                       {threat.status.toUpperCase()}
//                     </span>
//                   </div>

//                   <div className="flex space-x-1">
//                     <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 flex-1">
//                       Deploy
//                     </button>
//                     <button className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 flex-1">
//                       Investigate
//                     </button>
//                   </div>
//                 </div>
//               ))}
//           </div>

//           {/* System Status Panel */}
//           <div className="border-t border-slate-600 pt-4">
//             <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
//               <Radio className="w-4 h-4" />
//               <span>System Status</span>
//             </h3>

//             <div className="space-y-3">
//               <div className="bg-slate-700 rounded p-3">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm font-medium">Network Status</span>
//                   <span
//                     className={`text-xs px-2 py-1 rounded ${
//                       connectionStatus === "connected"
//                         ? "bg-green-800 text-green-200"
//                         : "bg-red-800 text-red-200"
//                     }`}
//                   >
//                     {connectionStatus.toUpperCase()}
//                   </span>
//                 </div>
//                 <div className="text-xs text-slate-400">
//                   Uptime: 99.8% | Latency: 12ms
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Sensor Network</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-green-400">Active:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "active").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">Alert:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "alert").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Offline:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "inactive").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Threat Analysis</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Critical:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "critical" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">High:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) => t.severity === "high" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-yellow-400">Medium:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "medium" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-slate-400">Resolved:</span>
//                     <span>
//                       {threats.filter((t) => t.status === "resolved").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Threat Detail Modal */}
//       {selectedThreat && (
//         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center space-x-3">
//                 <h2 className="text-xl font-bold">
//                   Threat Intelligence Report
//                 </h2>
//                 <span
//                   className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(
//                     selectedThreat.severity
//                   )}`}
//                 >
//                   {selectedThreat.severity.toUpperCase()}
//                 </span>
//               </div>
//               <button
//                 onClick={() => setSelectedThreat(null)}
//                 className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Basic Information
//                   </h3>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <label className="text-slate-400">Threat ID</label>
//                       <p className="font-medium">{selectedThreat.id}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Sensor ID</label>
//                       <p className="font-medium">{selectedThreat.sensorId}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Type</label>
//                       <p className="font-medium">
//                         {THREAT_TYPES[selectedThreat.type].icon}{" "}
//                         {THREAT_TYPES[selectedThreat.type].label}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Status</label>
//                       <p
//                         className={`font-medium ${
//                           selectedThreat.status === "active"
//                             ? "text-red-400"
//                             : selectedThreat.status === "investigating"
//                             ? "text-yellow-400"
//                             : "text-green-400"
//                         }`}
//                       >
//                         {selectedThreat.status.toUpperCase()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Movement Analysis
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Direction:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.direction}{" "}
//                         {getMovementIcon(selectedThreat.movement.direction)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Current Speed:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.speed.toFixed(1)} km/h
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Estimated Size:</span>
//                       <span className="font-medium">
//                         {selectedThreat.estimatedSize} individuals
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Confidence:</span>
//                       <span className="font-medium">
//                         {selectedThreat.confidence}%
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Threat Description
//                   </h3>
//                   <p className="text-slate-200 text-sm leading-relaxed">
//                     {selectedThreat.description}
//                   </p>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Location & Time
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div>
//                       <label className="text-slate-400">Location</label>
//                       <p className="font-medium">
//                         {selectedThreat.location.name}
//                       </p>
//                       <p className="text-xs text-slate-500">
//                         {selectedThreat.location.lat.toFixed(4)},{" "}
//                         {selectedThreat.location.lng.toFixed(4)}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">First Detected</label>
//                       <p className="font-medium">
//                         {selectedThreat.timestamp.toLocaleString()}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Last Update</label>
//                       <p className="font-medium">
//                         {selectedThreat.movement.lastUpdate.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-600">
//               <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center space-x-2">
//                 <AlertTriangle className="w-4 h-4" />
//                 <span>Deploy Emergency Response</span>
//               </button>
//               <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center space-x-2">
//                 <Users className="w-4 h-4" />
//                 <span>Request Backup</span>
//               </button>
//               <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 flex items-center space-x-2">
//                 <Eye className="w-4 h-4" />
//                 <span>Mark Investigating</span>
//               </button>
//               <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
//                 Mark Resolved
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EnhancedBorderSurveillance;







// Enhanced Border Surveillance System with Real-Time Threat Detection and AI Integration (YOLOv7)
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Fragment,
} from "react";
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
  Target,
  Bell,
  Activity,
  Navigation,
  Radio,
  Settings,
  Filter,
  Play,
  Pause,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Polyline,
  Popup,
  useMap,
  Tooltip,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import "leaflet/dist/leaflet.css";
import benueBoundaryData from "@/data/benue1.geojson.json"; // Assume GeoJSON data for Benue state
// import './EnhancedBorderSurveillance.css'; // Custom CSS for styling
import * as tf from "@tensorflow/tfjs";

// COCO class labels for YOLO
const labels = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
  'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
  'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

// Simulated video sources for stakeholder demo
const VIDEO_SOURCES: Record<string, string> = {
  "Makurdi Border North Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "Gboko Checkpoint Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "Otukpo Border East Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "Katsina-Ala West Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "Vandeikya South Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
};

// Types (unchanged)
type SensorStatus = "active" | "inactive" | "alert" | "maintenance";
type ThreatSeverity = "low" | "medium" | "high" | "critical";
type ThreatType =
  | "intrusion"
  | "suspicious_activity"
  | "armed_group"
  | "vehicle_movement"
  | "cyber_threat"
  | "equipment_tampering";
type ThreatStatus = "active" | "investigating" | "resolved" | "escalated";
type ConnectionStatus = "connected" | "disconnected" | "reconnecting";
type MovementDirection = "inbound" | "outbound" | "lateral" | "stationary";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationInfo extends Coordinates {
  name: string;
}

interface Sensor {
  id: string;
  name: string;
  coordinates: Coordinates;
  status: SensorStatus;
  lastUpdate: Date;
  batteryLevel: number;
  signalStrength: number;
  sensorType: "motion" | "thermal" | "acoustic" | "camera" | "seismic";
}

interface ThreatMovement {
  currentPosition: Coordinates;
  previousPosition: Coordinates;
  direction: MovementDirection;
  speed: number; // km/h
  trajectory: Coordinates[];
  lastUpdate: Date;
}

interface Threat {
  id: string;
  sensorId: string;
  type: ThreatType;
  severity: ThreatSeverity;
  location: LocationInfo;
  timestamp: Date;
  description: string;
  personnel: number;
  status: ThreatStatus;
  movement: ThreatMovement;
  estimatedSize: number;
  confidence: number; // 0-100%
  predictedPosition?: Coordinates;
}

// Mock DetectedObject for compatibility
interface MockDetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // x, y, width, height
}

// YOLO Model State
interface YOLOModel {
  net: tf.GraphModel;
  inputShape: number[];
}

// Constants (unchanged)
const THREAT_TYPES: Record<ThreatType, { label: string; icon: string }> = {
  intrusion: { label: "Border Intrusion", icon: "👥" },
  suspicious_activity: { label: "Suspicious Activity", icon: "👁️" },
  armed_group: { label: "Armed Group", icon: "⚔️" },
  vehicle_movement: { label: "Vehicle Movement", icon: "🚗" },
  cyber_threat: { label: "Cyber Threat", icon: "💻" },
  equipment_tampering: { label: "Equipment Tampering", icon: "🔧" },
};

const SEVERITY_CONFIG: Record<
  ThreatSeverity,
  { color: string; bgColor: string; priority: number }
> = {
  low: { color: "text-green-400", bgColor: "bg-green-500", priority: 1 },
  medium: { color: "text-yellow-400", bgColor: "bg-yellow-500", priority: 2 },
  high: { color: "text-orange-400", bgColor: "bg-orange-500", priority: 3 },
  critical: { color: "text-red-400", bgColor: "bg-red-500", priority: 4 },
};

// Custom Icons (unchanged)
const sensorIcon = (status: SensorStatus) =>
  L.divIcon({
    className: "",
    html: `<div style="background-color: ${
      status === "active" ? "green" : status === "alert" ? "orange" : "red"
    }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
  });

const threatIcon = (severity: ThreatSeverity) =>
  L.divIcon({
    className: "",
    html: `<div style="background-color: ${
      severity === "critical"
        ? "red"
        : severity === "high"
        ? "orange"
        : severity === "medium"
        ? "yellow"
        : "green"
    }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20],
  });

const predictedIcon = L.divIcon({
  className: "",
  html: `<div style="background-color: gray; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; opacity: 0.7;"></div>`,
  iconSize: [15, 15],
});

// Utility functions (unchanged)
const isPointInPolygon = (point: Coordinates, polygon: number[][]): boolean => {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
};

const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (start: Coordinates, end: Coordinates): number => {
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const generateRandomPoint = (bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): Coordinates => ({
  lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
  lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng),
});

const movePointTowardTarget = (
  current: Coordinates,
  target: Coordinates,
  speedKmH: number,
  intervalMs: number
): Coordinates => {
  const distance = calculateDistance(current, target);
  const bearing = calculateBearing(current, target);

  const movementKm = (speedKmH * intervalMs) / (1000 * 60 * 60);

  if (distance <= movementKm) {
    return target;
  }

  const bearingRad = (bearing * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const lat1 = (current.lat * Math.PI) / 180;
  const lng1 = (current.lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(movementKm / R) +
      Math.cos(lat1) * Math.sin(movementKm / R) * Math.cos(bearingRad)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(movementKm / R) * Math.cos(lat1),
      Math.cos(movementKm / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
};

// YOLO Preprocessing Function
const preprocess = (
  source: HTMLVideoElement,
  modelWidth: number,
  modelHeight: number
) => {
  return tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    const [h, w] = img.shape.slice(0, 2);
    const maxSize = Math.max(w, h);
    const imgPadded = img.pad([
      [0, maxSize - h],
      [0, maxSize - w],
      [0, 0],
    ]) as tf.Tensor<tf.Rank.R3>;

    const xRatio = maxSize / w;
    const yRatio = maxSize / h;
    const input = tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight])
      .div(255.0)
      .expandDims(0);
    return { input, xRatio, yRatio };
  });
};

// YOLO Render Boxes Function
const renderBoxesSimple = (
  canvas: HTMLCanvasElement,
  boxes_data: number[][],
  ratios: number[],
  threshold: number
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const font = `${Math.max(Math.round(Math.max(canvas.width, canvas.height) / 40), 14)}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";

  boxes_data.forEach((det) => {
    const [x0, y0, x1, y1, cls_id, score] = det;
    if (score < threshold) return;
    const [xRatio, yRatio] = ratios;

    // Scale to original video size
    const origX0 = Math.max(0, x0 * xRatio);
    const origY0 = Math.max(0, y0 * yRatio);
    const origX1 = Math.min(canvas.width, x1 * xRatio);
    const origY1 = Math.min(canvas.height, y1 * yRatio);

    // Simple color based on class
    const color = `hsl(${(cls_id * 37) % 360}, 100%, 50%)`;
    ctx.fillStyle = color + "20"; // Semi-transparent
    ctx.fillRect(origX0, origY0, origX1 - origX0, origY1 - origY0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(origX0, origY0, origX1 - origX0, origY1 - origY0);

    // Label
    const text = `${labels[cls_id] || "unknown"}: ${Math.round(score * 100)}%`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(font, 10);
    const yText = origY0 - (textHeight + ctx.lineWidth);
    ctx.fillStyle = color;
    ctx.fillRect(origX0 - 1, yText < 0 ? 0 : yText, textWidth + ctx.lineWidth, textHeight + ctx.lineWidth);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, origX0 - 1, yText < 0 ? 0 : yText);
  });
};

// YOLO Detection Function
const detectYOLO = async (
  video: HTMLVideoElement,
  model: YOLOModel,
  threshold: number,
  canvas: HTMLCanvasElement
): Promise<MockDetectedObject[]> => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
  const { input, xRatio, yRatio } = preprocess(video, modelWidth, modelHeight);

  tf.engine().startScope();
  const res = (await model.net.executeAsync(input)) as tf.Tensor<tf.Rank.R2>;
  const dets = await res.array();

  // Render boxes
  renderBoxesSimple(canvas, dets, [xRatio, yRatio], threshold / 100);

  // Extract detections above threshold
  const detections: MockDetectedObject[] = [];
  dets.forEach((det) => {
    const [x0, y0, x1, y1, cls_id, score] = det;
    if (score > threshold / 100) {
      const bbox: [number, number, number, number] = [
        x0 * xRatio,
        y0 * yRatio,
        (x1 - x0) * xRatio,
        (y1 - y0) * yRatio,
      ];
      detections.push({
        class: labels[cls_id] || "unknown",
        score,
        bbox,
      });
    }
  });

  tf.dispose([res, input]);
  tf.engine().endScope();

  return detections;
};

// Custom Map Controls (enhanced with AI toggle and speed slider)
const MapControls: React.FC<{
  threats: Threat[];
  showSensors: boolean;
  setShowSensors: (val: boolean) => void;
  showThreats: boolean;
  setShowThreats: (val: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean) => void;
  aiDetectionEnabled: boolean;
  setAiDetectionEnabled: (val: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (val: number) => void;
}> = ({
  threats,
  showSensors,
  setShowSensors,
  showThreats,
  setShowThreats,
  showHeatmap,
  setShowHeatmap,
  aiDetectionEnabled,
  setAiDetectionEnabled,
  simulationSpeed,
  setSimulationSpeed,
}) => {
  const map = useMap();

  const zoomToThreats = useCallback(() => {
    if (threats.length === 0) return;
    const threatBounds = L.latLngBounds(
      threats.map((t) => [
        t.movement.currentPosition.lat,
        t.movement.currentPosition.lng,
      ])
    );
    map.fitBounds(threatBounds);
  }, [map, threats]);

  return (
    <div className="leaflet-top leaflet-left bg-slate-800 rounded p-2 text-xs space-y-1 z-[1000] m-2">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={showSensors}
          onChange={() => setShowSensors(!showSensors)}
        />
        <span>Sensors</span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={showThreats}
          onChange={() => setShowThreats(!showThreats)}
        />
        <span>Threats</span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={showHeatmap}
          onChange={() => setShowHeatmap(!showHeatmap)}
        />
        <span>Heatmap</span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={aiDetectionEnabled}
          onChange={() => setAiDetectionEnabled(!aiDetectionEnabled)}
        />
        <span>AI Detection</span>
      </div>
      <div className="flex items-center space-x-2">
        <label>Speed:</label>
        <input
          type="range"
          min="1000"
          max="5000"
          step="500"
          value={simulationSpeed}
          onChange={(e) => setSimulationSpeed(Number(e.target.value))}
          className="w-20"
        />
        <span>{simulationSpeed / 1000}s</span>
      </div>
      <button
        onClick={zoomToThreats}
        className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
      >
        Zoom to Threats
      </button>
    </div>
  );
};

// Main Component (enhanced)
const EnhancedBorderSurveillance: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<Threat[]>([]); // New: for filtering
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [selectedThreatType, setSelectedThreatType] = useState<ThreatType | "all">("all"); // New: filter
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [aiDetectionEnabled, setAiDetectionEnabled] = useState<boolean>(true); // New
  const [simulationSpeed, setSimulationSpeed] = useState<number>(3000); // New: default 3s
  const [notifications, setNotifications] = useState<
    { id: string; message: string; severity: ThreatSeverity }[]
  >([]);
  const [model, setModel] = useState<YOLOModel | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const boundaryCoords = useMemo(() => {
    const geometry = benueBoundaryData.features[0].geometry;
    return geometry.type === "Polygon" ? geometry.coordinates[0] : [];
  }, []);

  const bounds = useMemo(
    () => ({
      minLat: 6.4,
      maxLat: 8.1,
      minLng: 7.8,
      maxLng: 9.7,
    }),
    []
  );

  // Heatmap data (unchanged)
  const heatmapData = useMemo(
    () =>
      threats.map((threat) => ({
        lat: threat.movement.currentPosition.lat,
        lng: threat.movement.currentPosition.lng,
        value: SEVERITY_CONFIG[threat.severity].priority,
      })),
    [threats]
  );

  // Filter threats by type
  useEffect(() => {
    if (selectedThreatType === "all") {
      setFilteredThreats(threats);
    } else {
      setFilteredThreats(threats.filter((t) => t.type === selectedThreatType));
    }
  }, [threats, selectedThreatType]);

  const generateNewThreatFromDetection = useCallback(
    (sensorId: string, prediction: MockDetectedObject): Threat | null => {
      const sensor = sensors.find((s) => s.id === sensorId);
      if (!sensor) return null;

      let type: ThreatType = "suspicious_activity";
      let severity: ThreatSeverity = "medium";
      const description = `YOLO detected ${prediction.class} with ${Math.round(
        prediction.score * 100
      )}% confidence.`;

      if (prediction.class === "person") {
        type = "intrusion";
        severity = "high";
      } else if (["car", "truck", "bus"].includes(prediction.class)) {
        type = "vehicle_movement";
        severity = "medium";
      } else if (["bicycle", "motorcycle"].includes(prediction.class)) {
        type = "vehicle_movement";
        severity = "low";
      }

      const startPosition = {
        lat: sensor.coordinates.lat + (Math.random() - 0.5) * 0.05,
        lng: sensor.coordinates.lng + (Math.random() - 0.5) * 0.05,
      };

      return {
        id: `T${Date.now()}`,
        sensorId,
        type,
        severity,
        location: {
          ...startPosition,
          name: `Near ${sensor.name}`,
        },
        timestamp: new Date(),
        description,
        personnel: 1,
        status: "active",
        movement: {
          currentPosition: startPosition,
          previousPosition: startPosition,
          direction: "stationary",
          speed: 0,
          trajectory: [startPosition],
          lastUpdate: new Date(),
        },
        estimatedSize: 1,
        confidence: Math.round(prediction.score * 100),
      };
    },
    [sensors]
  );

  // Load YOLO Model
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      await tf.setBackend("webgl");
      try {
        const yolov7 = await tf.loadGraphModel(
          "./yolov7tiny_web_model/model.json", // Assume model in public folder
          { onProgress: (fractions) => console.log(`Loading: ${fractions * 100}%`) }
        );

        // Warmup
        const inputShape = yolov7.inputs[0].shape;
        if (!inputShape) {
          throw new Error("YOLOv7 model input shape is undefined.");
        }
        const dummyInput = tf.ones(inputShape);
        await yolov7.executeAsync(dummyInput);
        tf.dispose(dummyInput);

        setModel({
          net: yolov7,
          inputShape: yolov7.inputs[0].shape ?? [],
        });
      } catch (error) {
        console.error("Failed to load YOLO model:", error);
      }
    };
    loadModel();
  }, []);

  // YOLO Detection on Video Feeds
  const runDetection = useCallback(
    async (video: HTMLVideoElement, canvas: HTMLCanvasElement, sensorId: string) => {
      if (!model || !aiDetectionEnabled) return;

      const detections = await detectYOLO(video, model, 50, canvas); // Threshold 50%

      // Generate threats from high-confidence detections
      detections.forEach((prediction) => {
        if (prediction.score > 0.5) {
          const newThreat = generateNewThreatFromDetection(sensorId, prediction);
          if (newThreat) {
            setThreats((prev) => [newThreat, ...prev]);
            setNotifications((prev) =>
              [
                ...prev,
                {
                  id: `${sensorId}-${Date.now()}`,
                  message: `YOLO detected ${prediction.class} with ${Math.round(
                    prediction.score * 100
                  )}% confidence in ${sensorId}`,
                  severity: "high" as ThreatSeverity,
                },
              ].slice(-5)
            );
          }
        }
      });
    },
    [model, aiDetectionEnabled, generateNewThreatFromDetection]
  );

  useEffect(() => {
    if (model && isSimulationRunning && aiDetectionEnabled) {
      detectionIntervalRef.current = setInterval(() => {
        sensors.forEach((sensor) => {
          if (sensor.sensorType === "camera" && sensor.status === "active") {
            const video = videoRefs.current[sensor.id];
            const canvas = canvasRefs.current[sensor.id];
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              runDetection(video, canvas, sensor.id);
            }
          }
        });
      }, 2000);

      return () => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      };
    }
  }, [model, isSimulationRunning, aiDetectionEnabled, sensors, runDetection]);

  // Initialize sensors (unchanged)
  useEffect(() => {
    const initialSensors: Sensor[] = [
      {
        id: "Makurdi Border North Sensor",
        name: "Makurdi Border North",
        coordinates: { lat: 7.7319, lng: 8.5211 },
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 85,
        signalStrength: 92,
        sensorType: "thermal",
      },
      {
        id: "Gboko Checkpoint Sensor",
        name: "Gboko Checkpoint",
        coordinates: { lat: 7.3239, lng: 9.0043 },
        status: "alert",
        lastUpdate: new Date(),
        batteryLevel: 92,
        signalStrength: 88,
        sensorType: "camera",
      },
      {
        id: "Otukpo Border East Sensor",
        name: "Otukpo Border East",
        coordinates: { lat: 7.1905, lng: 8.1301 },
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 78,
        signalStrength: 85,
        sensorType: "motion",
      },
      {
        id: "Katsina-Ala West Sensor",
        name: "Katsina-Ala West",
        coordinates: { lat: 7.1667, lng: 9.2833 },
        status: "inactive",
        lastUpdate: new Date(Date.now() - 300000),
        batteryLevel: 45,
        signalStrength: 0,
        sensorType: "acoustic",
      },
      {
        id: "Vandeikya South Sensor",
        name: "Vandeikya South",
        coordinates: { lat: 6.7833, lng: 9.0667 },
        status: "active",
        lastUpdate: new Date(),
        batteryLevel: 95,
        signalStrength: 95,
        sensorType: "seismic",
      },
    ];

    setSensors(initialSensors);
  }, []);

  // Generate initial threats (unchanged)
  useEffect(() => {
    if (sensors.length === 0) return;

    const initialThreats: Threat[] = [
      {
        id: "T001",
        sensorId: "S002",
        type: "armed_group",
        severity: "critical",
        location: {
          lat: 7.2,
          lng: 8.8,
          name: "Border Perimeter North",
        },
        timestamp: new Date(Date.now() - 120000),
        description:
          "Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.",
        personnel: 10,
        status: "active",
        movement: {
          currentPosition: { lat: 7.2, lng: 8.8 },
          previousPosition: { lat: 7.15, lng: 8.75 },
          direction: "inbound",
          speed: 3.5,
          trajectory: [
            { lat: 7.1, lng: 8.7 },
            { lat: 7.15, lng: 8.75 },
            { lat: 7.2, lng: 8.8 },
          ],
          lastUpdate: new Date(),
        },
        estimatedSize: 10,
        confidence: 95,
      },
      {
        id: "T002",
        sensorId: "S001",
        type: "vehicle_movement",
        severity: "medium",
        location: {
          lat: 7.8,
          lng: 8.2,
          name: "Border Perimeter West",
        },
        timestamp: new Date(Date.now() - 300000),
        description:
          "Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.",
        personnel: 6,
        status: "investigating",
        movement: {
          currentPosition: { lat: 7.8, lng: 8.2 },
          previousPosition: { lat: 7.85, lng: 8.15 },
          direction: "outbound",
          speed: 45,
          trajectory: [
            { lat: 7.9, lng: 8.1 },
            { lat: 7.85, lng: 8.15 },
            { lat: 7.8, lng: 8.2 },
          ],
          lastUpdate: new Date(),
        },
        estimatedSize: 6,
        confidence: 82,
      },
    ];

    setThreats(initialThreats);
  }, [sensors]);

  // Threat movement simulation with prediction (unchanged)
  const updateThreatMovement = useCallback(() => {
    setThreats((prevThreats) =>
      prevThreats.map((threat) => {
        if (threat.status !== "active") return threat;

        const currentPos = threat.movement.currentPosition;
        const isInside = isPointInPolygon(currentPos, boundaryCoords);

        let newTarget: Coordinates;
        let newDirection: MovementDirection;
        let newSpeed = threat.movement.speed;

        switch (threat.type) {
          case "armed_group":
            if (isInside) {
              newTarget =
                Math.random() > 0.7
                  ? generateRandomPoint(bounds)
                  : generateRandomPoint({
                      minLat: bounds.minLat - 0.2,
                      maxLat: bounds.maxLat + 0.2,
                      minLng: bounds.minLng - 0.2,
                      maxLng: bounds.maxLng + 0.2,
                    });
              newDirection = "outbound";
              newSpeed = 2 + Math.random() * 3;
            } else {
              newTarget =
                Math.random() > 0.5
                  ? generateRandomPoint(bounds)
                  : generateRandomPoint({
                      minLat: bounds.minLat - 0.1,
                      maxLat: bounds.maxLat + 0.1,
                      minLng: bounds.minLng - 0.1,
                      maxLng: bounds.maxLng + 0.1,
                    });
              newDirection = "inbound";
              newSpeed = 1.5 + Math.random() * 2.5;
            }
            break;

          case "vehicle_movement":
            if (isInside) {
              newTarget = generateRandomPoint({
                minLat: bounds.minLat - 0.3,
                maxLat: bounds.maxLat + 0.3,
                minLng: bounds.minLng - 0.3,
                maxLng: bounds.maxLng + 0.3,
              });
              newDirection = "outbound";
            } else {
              newTarget =
                Math.random() > 0.6
                  ? generateRandomPoint(bounds)
                  : generateRandomPoint({
                      minLat: bounds.minLat - 0.2,
                      maxLat: bounds.maxLat + 0.2,
                      minLng: bounds.minLng - 0.2,
                      maxLng: bounds.maxLng + 0.2,
                    });
              newDirection = "inbound";
            }
            newSpeed = 25 + Math.random() * 35;
            break;

          default:
            newTarget = generateRandomPoint({
              minLat: bounds.minLat - 0.1,
              maxLat: bounds.maxLat + 0.1,
              minLng: bounds.minLng - 0.1,
              maxLng: bounds.maxLng + 0.1,
            });
            newDirection = isInside ? "outbound" : "inbound";
            newSpeed = 1 + Math.random() * 4;
        }

        const newPosition = movePointTowardTarget(
          currentPos,
          newTarget,
          newSpeed,
          simulationSpeed // Use dynamic speed
        );
        const predictedPosition = movePointTowardTarget(
          newPosition,
          newTarget,
          newSpeed,
          60000
        );

        return {
          ...threat,
          predictedPosition,
          movement: {
            currentPosition: newPosition,
            previousPosition: currentPos,
            direction: newDirection,
            speed: newSpeed,
            trajectory: [...threat.movement.trajectory.slice(-9), newPosition],
            lastUpdate: new Date(),
          },
          location: {
            ...threat.location,
            lat: newPosition.lat,
            lng: newPosition.lng,
          },
        };
      })
    );
  }, [boundaryCoords, bounds, simulationSpeed]);

  const generateNewThreat = useCallback((): Threat | null => {
    if (sensors.length === 0) return null;

    const threatTypes: ThreatType[] = [
      "intrusion",
      "suspicious_activity",
      "vehicle_movement",
      "armed_group",
    ];
    const severities: ThreatSeverity[] = ["low", "medium", "high", "critical"];
    const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];

    const startPosition =
      Math.random() > 0.5
        ? generateRandomPoint(bounds)
        : generateRandomPoint({
            minLat: bounds.minLat - 0.2,
            maxLat: bounds.maxLat + 0.2,
            minLng: bounds.minLng - 0.2,
            maxLng: bounds.maxLng + 0.2,
          });

    const threat: Threat = {
      id: `T${Date.now()}`,
      sensorId: randomSensor.id,
      type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      location: {
        lat: startPosition.lat,
        lng: startPosition.lng,
        name: "Auto-detected Threat",
      },
      timestamp: new Date(),
      description: "Automated threat detection by surveillance system.",
      personnel: Math.floor(Math.random() * 12) + 1,
      status: "active",
      movement: {
        currentPosition: startPosition,
        previousPosition: startPosition,
        direction: "stationary",
        speed: 0,
        trajectory: [startPosition],
        lastUpdate: new Date(),
      },
      estimatedSize: Math.floor(Math.random() * 15) + 1,
      confidence: Math.floor(Math.random() * 40) + 60,
    };

    if (
      ["high", "critical"].includes(threat.severity) &&
      soundEnabled &&
      audioRef.current
    ) {
      audioRef.current.play().catch(console.error);
      setNotifications((prev) =>
        [
          ...prev,
          {
            id: threat.id,
            message: `New ${threat.severity.toUpperCase()} threat detected: ${
              THREAT_TYPES[threat.type].label
            }`,
            severity: threat.severity,
          },
        ].slice(-5)
      );
    }

    return threat;
  }, [sensors, bounds, soundEnabled]);

  // Simulation loop (use dynamic speed)
  useEffect(() => {
    if (!isSimulationRunning) return;

    setConnectionStatus("connected");

    simulationIntervalRef.current = setInterval(() => {
      setSensors((prev) =>
        prev.map((sensor) => ({
          ...sensor,
          lastUpdate: new Date(),
          batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.1),
          signalStrength: Math.max(
            0,
            Math.min(100, sensor.signalStrength + (Math.random() - 0.5) * 5)
          ),
        }))
      );

      updateThreatMovement();

      if (Math.random() < 0.05) {
        const newThreat = generateNewThreat();
        if (newThreat) {
          setThreats((prev) => [newThreat, ...prev.slice(0, 19)]);
        }
      }

      setThreats((prev) =>
        prev.filter(
          (threat) =>
            threat.status !== "resolved" ||
            Date.now() - threat.timestamp.getTime() < 300000
        )
      );
    }, simulationSpeed);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulationRunning, updateThreatMovement, generateNewThreat, sensors, simulationSpeed]);

  // Auto-dismiss notifications (unchanged)
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getSeverityColor = (severity: ThreatSeverity): string => {
    return `${SEVERITY_CONFIG[severity].bgColor} text-white`;
  };

  const getStatusColor = (status: SensorStatus): string => {
    const colorMap: Record<SensorStatus, string> = {
      active: "text-green-400",
      inactive: "text-red-400",
      alert: "text-orange-400",
      maintenance: "text-yellow-400",
    };
    return colorMap[status];
  };

  const getMovementIcon = (direction: MovementDirection): string => {
    const icons: Record<MovementDirection, string> = {
      inbound: "↗️",
      outbound: "↙️",
      lateral: "↔️",
      stationary: "⏹️",
    };
    return icons[direction];
  };

  const activeCriticalThreats = useMemo(
    () =>
      threats.filter((t) => t.severity === "critical" && t.status === "active"),
    [threats]
  );

  const activeThreats = useMemo(
    () => threats.filter((t) => t.status === "active"),
    [threats]
  );

  const activeSensors = useMemo(
    () => sensors.filter((s) => s.status === "active"),
    [sensors]
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      {/* Audio element for alerts (unchanged) */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y"
          type="audio/wav"
        />
      </audio>

      {/* In-app notifications (unchanged) */}
      <div className="absolute top-20 right-4 z-20 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded shadow-lg text-white transform transition-all duration-300 ease-in-out animate-slide-in ${
              notif.severity === "critical" ? "bg-red-600" : "bg-orange-600"
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Header (enhanced with AI status) */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">
                Enhanced Border Surveillance (YOLOv7 AI)
              </h1>
              <p className="text-slate-400">
                Benue State - Real-time Threat Tracking
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
            <div className="flex items-center space-x-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  aiDetectionEnabled ? "bg-green-400" : "bg-gray-600"
                }`}
              />
              <span>YOLO Active</span>
            </div>

            <button
              onClick={() => setIsSimulationRunning(!isSimulationRunning)}
              className={`px-3 py-1 rounded text-sm ${
                isSimulationRunning
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

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

      {/* Critical Alert Banner (unchanged) */}
      {activeCriticalThreats.length > 0 && (
        <Alert className="px-6 py-3 bg-red-900 border-red-700 text-red-100 animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                CRITICAL ALERT: {activeCriticalThreats.length} active critical
                threat
                {activeCriticalThreats.length > 1 ? "s" : ""} detected
              </span>
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1">
        {/* Main Content (unchanged stats) */}
        <div className="flex-1 p-6">
          {/* Statistics Cards (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sensors</p>
                  <p className="text-2xl font-bold text-green-400">
                    {activeSensors.length}
                  </p>
                  <p className="text-xs text-slate-500">
                    of {sensors.length} total
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
                    {activeThreats.length}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeCriticalThreats.length} critical
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
                  <p className="text-xs text-slate-500">across all threats</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">System Status</p>
                  <p className="text-lg font-bold text-green-400">
                    Operational
                  </p>
                  <p className="text-xs text-slate-500">YOLOv7 Loaded</p>
                </div>
                <Settings className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Map (enhanced controls) */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Benue State Border Map - Live Tracking</span>
              </h2>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-1 text-sm text-blue-400">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>Sensors</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-red-400">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Active Threats</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-purple-400">
                  <Navigation className="w-3 h-3" />
                  <span>Movement Trails</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg h-[850px] relative overflow-hidden border border-slate-600">
              <MapContainer
                center={[7.5, 8.5]}
                zoom={9}
                style={{ height: "100%", width: "100%" }}
                maxBounds={[
                  [bounds.minLat - 0.5, bounds.minLng - 0.5],
                  [bounds.maxLat + 0.5, bounds.maxLng + 0.5],
                ]}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Polygon
                  positions={boundaryCoords.map(
                    ([lng, lat]) => [lat, lng] as LatLngExpression
                  )}
                  pathOptions={{ color: "blue", dashArray: "5, 5" }}
                />
                <MapControls
                  threats={threats}
                  showSensors={showSensors}
                  setShowSensors={setShowSensors}
                  showThreats={showThreats}
                  setShowThreats={setShowThreats}
                  showHeatmap={showHeatmap}
                  setShowHeatmap={setShowHeatmap}
                  aiDetectionEnabled={aiDetectionEnabled}
                  setAiDetectionEnabled={setAiDetectionEnabled}
                  simulationSpeed={simulationSpeed}
                  setSimulationSpeed={setSimulationSpeed}
                />
                {showSensors && (
                  <MarkerClusterGroup>
                    {sensors.map((sensor) => (
                      <Marker
                        key={sensor.id}
                        position={[
                          sensor.coordinates.lat,
                          sensor.coordinates.lng,
                        ]}
                        icon={sensorIcon(sensor.status)}
                      >
                        <Popup>
                          {sensor.name} - {sensor.status}
                        </Popup>
                        <Tooltip>{sensor.id}</Tooltip>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                )}
                {showThreats && (
                  <MarkerClusterGroup>
                    {activeThreats.map((threat) => (
                      <Fragment key={threat.id}>
                        <Marker
                          position={[
                            threat.movement.currentPosition.lat,
                            threat.movement.currentPosition.lng,
                          ]}
                          icon={threatIcon(threat.severity)}
                          eventHandlers={{
                            click: () => setSelectedThreat(threat),
                          }}
                        >
                          <Popup>
                            {THREAT_TYPES[threat.type].label}
                            <br />
                            Severity: {threat.severity}
                            <br />
                            Speed: {threat.movement.speed.toFixed(1)} km/h
                          </Popup>
                          <Tooltip direction="top">
                            {THREAT_TYPES[threat.type].label}
                          </Tooltip>
                        </Marker>
                        {threat.movement.trajectory.length > 1 && (
                          <Polyline
                            positions={threat.movement.trajectory.map(
                              (pos) => [pos.lat, pos.lng] as LatLngExpression
                            )}
                            pathOptions={{ color: "purple", dashArray: "2,2" }}
                          />
                        )}
                        {threat.predictedPosition && (
                          <>
                            <Polyline
                              positions={
                                [
                                  [
                                    threat.movement.currentPosition.lat,
                                    threat.movement.currentPosition.lng,
                                  ],
                                  [
                                    threat.predictedPosition.lat,
                                    threat.predictedPosition.lng,
                                  ],
                                ] as LatLngExpression[]
                              }
                              pathOptions={{
                                color: "gray",
                                dashArray: "5,5",
                                opacity: 0.7,
                              }}
                            />
                            <Marker
                              position={[
                                threat.predictedPosition.lat,
                                threat.predictedPosition.lng,
                              ]}
                              icon={predictedIcon}
                            >
                              <Popup>Predicted Position (60s ahead)</Popup>
                              <Tooltip>Predicted</Tooltip>
                            </Marker>
                          </>
                        )}
                      </Fragment>
                    ))}
                  </MarkerClusterGroup>
                )}
                {showHeatmap && (
                  <HeatmapLayer
                    points={
                      heatmapData as Array<{
                        lat: number;
                        lng: number;
                        value: number;
                      }>
                    }
                    longitudeExtractor={(p: {
                      lat: number;
                      lng: number;
                      value: number;
                    }) => p.lng}
                    latitudeExtractor={(p: {
                      lat: number;
                      lng: number;
                      value: number;
                    }) => p.lat}
                    intensityExtractor={(p: {
                      lat: number;
                      lng: number;
                      value: number;
                    }) => p.value}
                    radius={20}
                    blur={15}
                    maxZoom={18}
                  />
                )}
              </MapContainer>

              {/* Simulation indicator (enhanced) */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-800 rounded px-3 py-1 border border-slate-600 z-[1000]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSimulationRunning
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                ></div>
                <span className="text-xs">
                  {isSimulationRunning
                    ? `Live Simulation (${simulationSpeed / 1000}s)`
                    : "Simulation Paused"}
                </span>
              </div>
            </div>
          </div>

          {/* Video Feeds (unchanged, but YOLO draws on canvas) */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Live Video Feeds & Sensor Data (YOLO Detection)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor) => {
                const videoSrc = VIDEO_SOURCES[sensor.id] || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                return (
                  <div
                    key={sensor.id}
                    className="bg-slate-700 rounded-lg p-3 border border-slate-600"
                  >
                    <div className="bg-black rounded aspect-video mb-3 relative overflow-hidden">
                      <video
                        ref={(el) => {
                          videoRefs.current[sensor.id] = el;
                        }}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover absolute top-0 left-0"
                      >
                        <source
                          src={videoSrc}
                          type="video/mp4"
                        />
                      </video>
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[sensor.id] = el;
                        }}
                        className="absolute top-0 left-0 pointer-events-none"
                      />
                      <div className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
                        {sensor.sensorType.toUpperCase()} - {sensor.id}
                      </div>
                      {isSimulationRunning && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                      {sensor.status === "alert" && (
                        <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{sensor.name}</span>
                        <span className={getStatusColor(sensor.status)}>
                          {sensor.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-600 rounded p-1">
                          <div className="text-slate-400">Battery</div>
                          <div className="font-medium">
                            {sensor.batteryLevel.toFixed(1)}%
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                            <div
                              className={`h-1 rounded-full ${
                                sensor.batteryLevel > 50
                                  ? "bg-green-400"
                                  : sensor.batteryLevel > 25
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${sensor.batteryLevel}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-600 rounded p-1">
                          <div className="text-slate-400">Signal</div>
                          <div className="font-medium">
                            {sensor.signalStrength.toFixed(0)}%
                          </div>
                          <div className="flex space-x-1 mt-1">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <div
                                key={bar}
                                className={`flex-1 h-1 rounded ${
                                  sensor.signalStrength >= bar * 20
                                    ? "bg-green-400"
                                    : "bg-slate-800"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        Last update: {sensor.lastUpdate.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar (with threat type filter) */}
        <div className="w-96 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Threat Intelligence</span>
          </h2>

          {/* Threat Filter (enhanced with dropdown) */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <label className="text-sm">Filter by Type:</label>
            </div>
            <select
              value={selectedThreatType}
              onChange={(e) => setSelectedThreatType(e.target.value as ThreatType | "all")}
              className="w-full p-2 bg-slate-700 text-white rounded"
            >
              <option value="all">All Types</option>
              {Object.keys(THREAT_TYPES).map((type) => (
                <option key={type} value={type}>
                  {THREAT_TYPES[type as ThreatType].label}
                </option>
              ))}
            </select>
            <div className="flex space-x-1 text-xs">
              <button className="px-2 py-1 bg-red-600 text-white rounded flex-1">
                Critical
              </button>
              <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
                High
              </button>
              <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
                Medium
              </button>
              <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
                All
              </button>
            </div>
          </div>

          {/* Threat List (use filteredThreats) */}
          <div
            className="space-y-3 mb-6"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {filteredThreats
              .sort(
                (a, b) =>
                  SEVERITY_CONFIG[b.severity].priority -
                  SEVERITY_CONFIG[a.severity].priority
              )
              .map((threat) => (
                <div
                  key={threat.id}
                  className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-all border
                    ${
                      selectedThreat?.id === threat.id
                        ? "ring-2 ring-blue-400 border-blue-400"
                        : "border-slate-600"
                    }
                    hover:bg-slate-600 hover:border-slate-500`}
                  onClick={() => setSelectedThreat(threat)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                          threat.severity
                        )}`}
                      >
                        {threat.severity.toUpperCase()}
                      </span>
                      <span className="text-xs">
                        {THREAT_TYPES[threat.type].icon}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-medium mb-1 text-sm">
                    {THREAT_TYPES[threat.type].label}
                  </h3>

                  <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                    {threat.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center space-x-1">
                      <Navigation className="w-3 h-3" />
                      <span>{threat.movement.direction}</span>
                      <span>{getMovementIcon(threat.movement.direction)}</span>
                    </span>
                    <span>{threat.movement.speed.toFixed(1)} km/h</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{threat.location.name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{threat.personnel}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">
                      Confidence: {threat.confidence}%
                    </span>
                    <span
                      className={`px-1 rounded ${
                        threat.status === "active"
                          ? "bg-red-800 text-red-200"
                          : threat.status === "investigating"
                          ? "bg-yellow-800 text-yellow-200"
                          : "bg-green-800 text-green-200"
                      }`}
                    >
                      {threat.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex space-x-1">
                    <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 flex-1">
                      Deploy
                    </button>
                    <button className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 flex-1">
                      Investigate
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* System Status Panel (unchanged) */}
          <div className="border-t border-slate-600 pt-4">
            <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
              <Radio className="w-4 h-4" />
              <span>System Status</span>
            </h3>

            <div className="space-y-3">
              <div className="bg-slate-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Network Status</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      connectionStatus === "connected"
                        ? "bg-green-800 text-green-200"
                        : "bg-red-800 text-red-200"
                    }`}
                  >
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Uptime: 99.8% | Latency: 12ms
                </div>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <div className="text-sm font-medium mb-2">Sensor Network</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-400">Active:</span>
                    <span>
                      {sensors.filter((s) => s.status === "active").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-400">Alert:</span>
                    <span>
                      {sensors.filter((s) => s.status === "alert").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Offline:</span>
                    <span>
                      {sensors.filter((s) => s.status === "inactive").length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <div className="text-sm font-medium mb-2">Threat Analysis</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400">Critical:</span>
                    <span>
                      {
                        threats.filter(
                          (t) =>
                            t.severity === "critical" && t.status === "active"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-400">High:</span>
                    <span>
                      {
                        threats.filter(
                          (t) => t.severity === "high" && t.status === "active"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Medium:</span>
                    <span>
                      {
                        threats.filter(
                          (t) =>
                            t.severity === "medium" && t.status === "active"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resolved:</span>
                    <span>
                      {threats.filter((t) => t.status === "resolved").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Threat Detail Modal (unchanged) */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold">
                  Threat Intelligence Report
                </h2>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(
                    selectedThreat.severity
                  )}`}
                >
                  {selectedThreat.severity.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-blue-400">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-slate-400">Threat ID</label>
                      <p className="font-medium">{selectedThreat.id}</p>
                    </div>
                    <div>
                      <label className="text-slate-400">Sensor ID</label>
                      <p className="font-medium">{selectedThreat.sensorId}</p>
                    </div>
                    <div>
                      <label className="text-slate-400">Type</label>
                      <p className="font-medium">
                        {THREAT_TYPES[selectedThreat.type].icon}{" "}
                        {THREAT_TYPES[selectedThreat.type].label}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-400">Status</label>
                      <p
                        className={`font-medium ${
                          selectedThreat.status === "active"
                            ? "text-red-400"
                            : selectedThreat.status === "investigating"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {selectedThreat.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-blue-400">
                    Movement Analysis
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Direction:</span>
                      <span className="font-medium">
                        {selectedThreat.movement.direction}{" "}
                        {getMovementIcon(selectedThreat.movement.direction)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Speed:</span>
                      <span className="font-medium">
                        {selectedThreat.movement.speed.toFixed(1)} km/h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Size:</span>
                      <span className="font-medium">
                        {selectedThreat.estimatedSize} individuals
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="font-medium">
                        {selectedThreat.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-blue-400">
                    Threat Description
                  </h3>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {selectedThreat.description}
                  </p>
                </div>

                <div className="bg-slate-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-blue-400">
                    Location & Time
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-slate-400">Location</label>
                      <p className="font-medium">
                        {selectedThreat.location.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedThreat.location.lat.toFixed(4)},{" "}
                        {selectedThreat.location.lng.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-400">First Detected</label>
                      <p className="font-medium">
                        {selectedThreat.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-400">Last Update</label>
                      <p className="font-medium">
                        {selectedThreat.movement.lastUpdate.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-600">
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Deploy Emergency Response</span>
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Request Backup</span>
              </button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Mark Investigating</span>
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBorderSurveillance;









// Enhanced Border Surveillance System with Real-Time Threat Detection and AI Integration (YOLOv7 + OpenCV.js)
// import {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
//   Fragment,
// } from "react";
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
//   Target,
//   Bell,
//   Activity,
//   Navigation,
//   Radio,
//   Settings,
//   Filter,
//   Play,
//   Pause,
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Polyline,
//   Popup,
//   useMap,
//   Tooltip,
// } from "react-leaflet";
// import L, { type LatLngExpression } from "leaflet";
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
// import "leaflet/dist/leaflet.css";
// import benueBoundaryData from "@/data/benue1.geojson.json"; // Assume GeoJSON data for Benue state
// // import './EnhancedBorderSurveillance.css'; // Custom CSS for styling
// import * as tf from "@tensorflow/tfjs";

// // COCO class labels for YOLO
// const labels = [
//   'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
//   'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
//   'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
//   'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
//   'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
//   'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
//   'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
//   'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
//   'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
//   'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
// ];

// // Simulated video sources for stakeholder demo
// const VIDEO_SOURCES: Record<string, string> = {
//   "Makurdi Border North Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
//   "Gboko Checkpoint Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
//   "Otukpo Border East Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
//   "Katsina-Ala West Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
//   "Vandeikya South Sensor": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
// };

// // Types (unchanged)
// type SensorStatus = "active" | "inactive" | "alert" | "maintenance";
// type ThreatSeverity = "low" | "medium" | "high" | "critical";
// type ThreatType =
//   | "intrusion"
//   | "suspicious_activity"
//   | "armed_group"
//   | "vehicle_movement"
//   | "cyber_threat"
//   | "equipment_tampering";
// type ThreatStatus = "active" | "investigating" | "resolved" | "escalated";
// type ConnectionStatus = "connected" | "disconnected" | "reconnecting";
// type MovementDirection = "inbound" | "outbound" | "lateral" | "stationary";

// interface Coordinates {
//   lat: number;
//   lng: number;
// }

// interface LocationInfo extends Coordinates {
//   name: string;
// }

// interface Sensor {
//   id: string;
//   name: string;
//   coordinates: Coordinates;
//   status: SensorStatus;
//   lastUpdate: Date;
//   batteryLevel: number;
//   signalStrength: number;
//   sensorType: "motion" | "thermal" | "acoustic" | "camera" | "seismic";
// }

// interface ThreatMovement {
//   currentPosition: Coordinates;
//   previousPosition: Coordinates;
//   direction: MovementDirection;
//   speed: number; // km/h
//   trajectory: Coordinates[];
//   lastUpdate: Date;
// }

// interface Threat {
//   id: string;
//   sensorId: string;
//   type: ThreatType;
//   severity: ThreatSeverity;
//   location: LocationInfo;
//   timestamp: Date;
//   description: string;
//   personnel: number;
//   status: ThreatStatus;
//   movement: ThreatMovement;
//   estimatedSize: number;
//   confidence: number; // 0-100%
//   predictedPosition?: Coordinates;
// }

// // Mock DetectedObject for compatibility
// interface MockDetectedObject {
//   class: string;
//   score: number;
//   bbox: [number, number, number, number]; // x, y, width, height
// }

// // YOLO Model State
// interface YOLOModel {
//   net: tf.GraphModel;
//   inputShape: number[];
// }

// // Constants (unchanged)
// const THREAT_TYPES: Record<ThreatType, { label: string; icon: string }> = {
//   intrusion: { label: "Border Intrusion", icon: "👥" },
//   suspicious_activity: { label: "Suspicious Activity", icon: "👁️" },
//   armed_group: { label: "Armed Group", icon: "⚔️" },
//   vehicle_movement: { label: "Vehicle Movement", icon: "🚗" },
//   cyber_threat: { label: "Cyber Threat", icon: "💻" },
//   equipment_tampering: { label: "Equipment Tampering", icon: "🔧" },
// };

// const SEVERITY_CONFIG: Record<
//   ThreatSeverity,
//   { color: string; bgColor: string; priority: number }
// > = {
//   low: { color: "text-green-400", bgColor: "bg-green-500", priority: 1 },
//   medium: { color: "text-yellow-400", bgColor: "bg-yellow-500", priority: 2 },
//   high: { color: "text-orange-400", bgColor: "bg-orange-500", priority: 3 },
//   critical: { color: "text-red-400", bgColor: "bg-red-500", priority: 4 },
// };

// // Custom Icons (unchanged)
// const sensorIcon = (status: SensorStatus) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       status === "active" ? "green" : status === "alert" ? "orange" : "red"
//     }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [16, 16],
//   });

// const threatIcon = (severity: ThreatSeverity) =>
//   L.divIcon({
//     className: "",
//     html: `<div style="background-color: ${
//       severity === "critical"
//         ? "red"
//         : severity === "high"
//         ? "orange"
//         : severity === "medium"
//         ? "yellow"
//         : "green"
//     }; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
//     iconSize: [20, 20],
//   });

// const predictedIcon = L.divIcon({
//   className: "",
//   html: `<div style="background-color: gray; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; opacity: 0.7;"></div>`,
//   iconSize: [15, 15],
// });

// // Utility functions (unchanged)
// const isPointInPolygon = (point: Coordinates, polygon: number[][]): boolean => {
//   const { lat, lng } = point;
//   let inside = false;

//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const [xi, yi] = polygon[i];
//     const [xj, yj] = polygon[j];

//     if (
//       yi > lat !== yj > lat &&
//       lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
//     ) {
//       inside = !inside;
//     }
//   }

//   return inside;
// };

// const calculateDistance = (
//   point1: Coordinates,
//   point2: Coordinates
// ): number => {
//   const R = 6371; // Earth's radius in km
//   const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
//   const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((point1.lat * Math.PI) / 180) *
//       Math.cos((point2.lat * Math.PI) / 180) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const calculateBearing = (start: Coordinates, end: Coordinates): number => {
//   const dLng = ((end.lng - start.lng) * Math.PI) / 180;
//   const lat1 = (start.lat * Math.PI) / 180;
//   const lat2 = (end.lat * Math.PI) / 180;

//   const y = Math.sin(dLng) * Math.cos(lat2);
//   const x =
//     Math.cos(lat1) * Math.sin(lat2) -
//     Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

//   return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
// };

// const generateRandomPoint = (bounds: {
//   minLat: number;
//   maxLat: number;
//   minLng: number;
//   maxLng: number;
// }): Coordinates => ({
//   lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
//   lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng),
// });

// const movePointTowardTarget = (
//   current: Coordinates,
//   target: Coordinates,
//   speedKmH: number,
//   intervalMs: number
// ): Coordinates => {
//   const distance = calculateDistance(current, target);
//   const bearing = calculateBearing(current, target);

//   const movementKm = (speedKmH * intervalMs) / (1000 * 60 * 60);

//   if (distance <= movementKm) {
//     return target;
//   }

//   const bearingRad = (bearing * Math.PI) / 180;
//   const R = 6371; // Earth radius in km

//   const lat1 = (current.lat * Math.PI) / 180;
//   const lng1 = (current.lng * Math.PI) / 180;

//   const lat2 = Math.asin(
//     Math.sin(lat1) * Math.cos(movementKm / R) +
//       Math.cos(lat1) * Math.sin(movementKm / R) * Math.cos(bearingRad)
//   );

//   const lng2 =
//     lng1 +
//     Math.atan2(
//       Math.sin(bearingRad) * Math.sin(movementKm / R) * Math.cos(lat1),
//       Math.cos(movementKm / R) - Math.sin(lat1) * Math.sin(lat2)
//     );

//   return {
//     lat: (lat2 * 180) / Math.PI,
//     lng: (lng2 * 180) / Math.PI,
//   };
// };

// // OpenCV.js Preprocessing for YOLO
// const preprocessWithOpenCV = (
//   video: HTMLVideoElement,
//   modelWidth: number,
//   modelHeight: number
// ) => {
//   const frame = cv.imread(video);
//   const [h, w] = [frame.rows, frame.cols];
//   const maxSize = Math.max(w, h);
//   const padH = maxSize - h;
//   const padW = maxSize - w;
//   const padded = new cv.Mat();
//   cv.copyMakeBorder(frame, padded, Math.round(padH / 2), Math.round(padH / 2), Math.round(padW / 2), Math.round(padW / 2), cv.BORDER_CONSTANT, cv.Scalar.all(114));

//   const resized = new cv.Mat();
//   cv.resize(padded, resized, new cv.Size(modelWidth, modelHeight), 0, 0, cv.INTER_LINEAR);

//   const input = tf.tidy(() => tf.browser.fromPixels(resized).div(255.0).expandDims(0));

//   frame.delete();
//   padded.delete();
//   resized.delete();

//   const xRatio = maxSize / w;
//   const yRatio = maxSize / h;

//   return { input, xRatio, yRatio };
// };

// // YOLO Detection with OpenCV Drawing
// const detectYOLOWithOpenCV = async (
//   video: HTMLVideoElement,
//   model: YOLOModel,
//   threshold: number,
//   canvas: HTMLCanvasElement
// ): Promise<MockDetectedObject[]> => {
//   if (typeof cv === 'undefined') return [];

//   const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
//   const { input, xRatio, yRatio } = preprocessWithOpenCV(video, modelWidth, modelHeight);

//   tf.engine().startScope();
//   const res = (await model.net.executeAsync(input)) as tf.Tensor<tf.Rank.R2>;
//   const dets = await res.array();

//   // Capture frame for drawing
//   let frame = cv.imread(video);

//   // Draw boxes with OpenCV
//   const detections: MockDetectedObject[] = [];
//   (dets[0] as number[][]).forEach((det) => {
//     const [_, x0, y0, x1, y1, cls_id, score] = det;
//     if (score < threshold / 100) return;

//     // Scale to original size
//     const origX0 = Math.max(0, x0 * modelWidth * xRatio);
//     const origY0 = Math.max(0, y0 * modelHeight * yRatio);
//     const origX1 = Math.min(video.videoWidth, x1 * modelWidth * xRatio);
//     const origY1 = Math.min(video.videoHeight, y1 * modelHeight * yRatio);

//     const point1 = new cv.Point(origX0, origY0);
//     const point2 = new cv.Point(origX1, origY1);
//     const color = new cv.Scalar(0, 0, 255, 255); // Red BGR
//     cv.rectangle(frame, point1, point2, color, 2);

//     // Label
//     const label = `${labels[cls_id] || "unknown"}: ${Math.round(score * 100)}%`;
//     cv.putText(frame, label, new cv.Point(origX0, origY0 - 5), cv.FONT_HERSHEY_SIMPLEX, 0.5, color, 1);

//     // For threat
//     detections.push({
//       class: labels[cls_id] || "unknown",
//       score,
//       bbox: [origX0, origY0, origX1 - origX0, origY1 - origY0],
//     });
//   });

//   cv.imshow(canvas, frame);
//   frame.delete();

//   tf.dispose([res, input]);
//   tf.engine().endScope();

//   return detections;
// };

// // Custom Map Controls (unchanged)
// const MapControls: React.FC<{
//   threats: Threat[];
//   showSensors: boolean;
//   setShowSensors: (val: boolean) => void;
//   showThreats: boolean;
//   setShowThreats: (val: boolean) => void;
//   showHeatmap: boolean;
//   setShowHeatmap: (val: boolean) => void;
//   aiDetectionEnabled: boolean;
//   setAiDetectionEnabled: (val: boolean) => void;
//   simulationSpeed: number;
//   setSimulationSpeed: (val: number) => void;
// }> = ({
//   threats,
//   showSensors,
//   setShowSensors,
//   showThreats,
//   setShowThreats,
//   showHeatmap,
//   setShowHeatmap,
//   aiDetectionEnabled,
//   setAiDetectionEnabled,
//   simulationSpeed,
//   setSimulationSpeed,
// }) => {
//   const map = useMap();

//   const zoomToThreats = useCallback(() => {
//     if (threats.length === 0) return;
//     const threatBounds = L.latLngBounds(
//       threats.map((t) => [
//         t.movement.currentPosition.lat,
//         t.movement.currentPosition.lng,
//       ])
//     );
//     map.fitBounds(threatBounds);
//   }, [map, threats]);

//   return (
//     <div className="leaflet-top leaflet-left bg-slate-800 rounded p-2 text-xs space-y-1 z-[1000] m-2">
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showSensors}
//           onChange={() => setShowSensors(!showSensors)}
//         />
//         <span>Sensors</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showThreats}
//           onChange={() => setShowThreats(!showThreats)}
//         />
//         <span>Threats</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={showHeatmap}
//           onChange={() => setShowHeatmap(!showHeatmap)}
//         />
//         <span>Heatmap</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={aiDetectionEnabled}
//           onChange={() => setAiDetectionEnabled(!aiDetectionEnabled)}
//         />
//         <span>AI Detection</span>
//       </div>
//       <div className="flex items-center space-x-2">
//         <label>Speed:</label>
//         <input
//           type="range"
//           min="1000"
//           max="5000"
//           step="500"
//           value={simulationSpeed}
//           onChange={(e) => setSimulationSpeed(Number(e.target.value))}
//           className="w-20"
//         />
//         <span>{simulationSpeed / 1000}s</span>
//       </div>
//       <button
//         onClick={zoomToThreats}
//         className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
//       >
//         Zoom to Threats
//       </button>
//     </div>
//   );
// };

// // Main Component (enhanced with OpenCV)
// const EnhancedBorderSurveillance: React.FC = () => {
//   const [sensors, setSensors] = useState<Sensor[]>([]);
//   const [threats, setThreats] = useState<Threat[]>([]);
//   const [filteredThreats, setFilteredThreats] = useState<Threat[]>([]);
//   const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
//   const [selectedThreatType, setSelectedThreatType] = useState<ThreatType | "all">("all");
//   const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
//   const [connectionStatus, setConnectionStatus] =
//     useState<ConnectionStatus>("disconnected");
//   const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
//   const [aiDetectionEnabled, setAiDetectionEnabled] = useState<boolean>(true);
//   const [simulationSpeed, setSimulationSpeed] = useState<number>(3000);
//   const [notifications, setNotifications] = useState<
//     { id: string; message: string; severity: ThreatSeverity }[]
//   >([]);
//   const [model, setModel] = useState<YOLOModel | null>(null);
//   const [cvLoaded, setCvLoaded] = useState<boolean>(false);
//   const [showSensors, setShowSensors] = useState(true);
//   const [showThreats, setShowThreats] = useState(true);
//   const [showHeatmap, setShowHeatmap] = useState(false);
//   const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
//   const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
//   const animationRef = useRef<number | null>(null);

//   const audioRef = useRef<HTMLAudioElement>(null);
//   const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const boundaryCoords = useMemo(() => {
//     const geometry = benueBoundaryData.features[0].geometry;
//     return geometry.type === "Polygon" ? geometry.coordinates[0] : [];
//   }, []);

//   const bounds = useMemo(
//     () => ({
//       minLat: 6.4,
//       maxLat: 8.1,
//       minLng: 7.8,
//       maxLng: 9.7,
//     }),
//     []
//   );

//   // Heatmap data (unchanged)
//   const heatmapData = useMemo(
//     () =>
//       threats.map((threat) => ({
//         lat: threat.movement.currentPosition.lat,
//         lng: threat.movement.currentPosition.lng,
//         value: SEVERITY_CONFIG[threat.severity].priority,
//       })),
//     [threats]
//   );

//   // Filter threats by type
//   useEffect(() => {
//     if (selectedThreatType === "all") {
//       setFilteredThreats(threats);
//     } else {
//       setFilteredThreats(threats.filter((t) => t.type === selectedThreatType));
//     }
//   }, [threats, selectedThreatType]);

//   // Load OpenCV.js asynchronously
//   useEffect(() => {
//     const loadOpenCV = () => {
//       if (typeof cv !== "undefined") {
//         cv.onRuntimeInitialized = () => {
//           console.log("OpenCV.js is ready.");
//           setCvLoaded(true);
//         };
//         return;
//       }

//       const script = document.createElement("script");
//       script.src = "https://docs.opencv.org/4.8.0/opencv.js";
//       script.async = true;
//       script.onload = () => {
//         if (typeof cv !== "undefined") {
//           cv.onRuntimeInitialized = () => {
//             console.log("OpenCV.js is ready.");
//             setCvLoaded(true);
//           };
//         }
//       };
//       script.onerror = () => console.error("Failed to load OpenCV.js");
//       document.head.appendChild(script);

//       return () => {
//         if (document.head.contains(script)) {
//           document.head.removeChild(script);
//         }
//       };
//     };

//     loadOpenCV();
//   }, []);

//   const generateNewThreatFromDetection = useCallback(
//     (sensorId: string, prediction: MockDetectedObject): Threat | null => {
//       const sensor = sensors.find((s) => s.id === sensorId);
//       if (!sensor) return null;

//       let type: ThreatType = "suspicious_activity";
//       let severity: ThreatSeverity = "medium";
//       const description = `YOLO detected ${prediction.class} with ${Math.round(
//         prediction.score * 100
//       )}% confidence.`;

//       if (prediction.class === "person") {
//         type = "intrusion";
//         severity = "high";
//       } else if (["car", "truck", "bus"].includes(prediction.class)) {
//         type = "vehicle_movement";
//         severity = "medium";
//       } else if (["bicycle", "motorcycle"].includes(prediction.class)) {
//         type = "vehicle_movement";
//         severity = "low";
//       }

//       const startPosition = {
//         lat: sensor.coordinates.lat + (Math.random() - 0.5) * 0.05,
//         lng: sensor.coordinates.lng + (Math.random() - 0.5) * 0.05,
//       };

//       return {
//         id: `T${Date.now()}`,
//         sensorId,
//         type,
//         severity,
//         location: {
//           ...startPosition,
//           name: `Near ${sensor.name}`,
//         },
//         timestamp: new Date(),
//         description,
//         personnel: 1,
//         status: "active",
//         movement: {
//           currentPosition: startPosition,
//           previousPosition: startPosition,
//           direction: "stationary",
//           speed: 0,
//           trajectory: [startPosition],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 1,
//         confidence: Math.round(prediction.score * 100),
//       };
//     },
//     [sensors]
//   );

//   // Load YOLO Model (unchanged)
//   useEffect(() => {
//     const loadModel = async () => {
//       await tf.ready();
//       await tf.setBackend("webgl");
//       try {
//         const yolov7 = await tf.loadGraphModel(
//           "./yolov7tiny_web_model/model.json",
//           { onProgress: (fractions) => console.log(`Loading: ${fractions * 100}%`) }
//         );

//         const dummyInput = tf.ones(yolov7.inputs[0].shape);
//         await yolov7.executeAsync(dummyInput);
//         tf.dispose(dummyInput);

//         setModel({
//           net: yolov7,
//           inputShape: yolov7.inputs[0].shape,
//         });
//       } catch (error) {
//         console.error("Failed to load YOLO model:", error);
//       }
//     };
//     loadModel();
//   }, []);

//   // Real-time Detection Loop with RAF and OpenCV
//   useEffect(() => {
//     let frameId: number;

//     const processLoop = async () => {
//       if (!model || !aiDetectionEnabled || !cvLoaded) {
//         frameId = requestAnimationFrame(processLoop);
//         return;
//       }

//       // For optimization, process every ~200ms by skipping frames
//       const now = Date.now();
//       static let lastProcess = 0;
//       if (now - lastProcess < 200) {
//         frameId = requestAnimationFrame(processLoop);
//         return;
//       }
//       lastProcess = now;

//       const promises = sensors
//         .filter((sensor) => sensor.sensorType === "camera" && sensor.status === "active")
//         .map(async (sensor) => {
//           const video = videoRefs.current[sensor.id];
//           const canvas = canvasRefs.current[sensor.id];
//           if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

//           canvas.width = video.videoWidth;
//           canvas.height = video.videoHeight;

//           const detections = await detectYOLOWithOpenCV(video, model, 50, canvas);

//           // Generate threats
//           detections.forEach((prediction) => {
//             if (prediction.score > 0.5) {
//               const newThreat = generateNewThreatFromDetection(sensor.id, prediction);
//               if (newThreat) {
//                 setThreats((prev) => [...prev, newThreat]);
//                 setNotifications((prev) => [
//                   ...prev,
//                   {
//                     id: `${sensor.id}-${Date.now()}`,
//                     message: `YOLO detected ${prediction.class} with ${Math.round(
//                       prediction.score * 100
//                     )}% confidence in ${sensor.id}`,
//                     severity: "high" as ThreatSeverity,
//                   },
//                 ].slice(-5));
//               }
//             }
//           });
//         });

//       await Promise.all(promises);

//       frameId = requestAnimationFrame(processLoop);
//     };

//     if (isSimulationRunning) {
//       processLoop();
//     }

//     return () => {
//       if (frameId) cancelAnimationFrame(frameId);
//     };
//   }, [model, aiDetectionEnabled, cvLoaded, isSimulationRunning, sensors, generateNewThreatFromDetection]);

//   // Initialize sensors (unchanged)
//   useEffect(() => {
//     const initialSensors: Sensor[] = [
//       {
//         id: "Makurdi Border North Sensor",
//         name: "Makurdi Border North",
//         coordinates: { lat: 7.7319, lng: 8.5211 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 85,
//         signalStrength: 92,
//         sensorType: "thermal",
//       },
//       {
//         id: "Gboko Checkpoint Sensor",
//         name: "Gboko Checkpoint",
//         coordinates: { lat: 7.3239, lng: 9.0043 },
//         status: "alert",
//         lastUpdate: new Date(),
//         batteryLevel: 92,
//         signalStrength: 88,
//         sensorType: "camera",
//       },
//       {
//         id: "Otukpo Border East Sensor",
//         name: "Otukpo Border East",
//         coordinates: { lat: 7.1905, lng: 8.1301 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 78,
//         signalStrength: 85,
//         sensorType: "motion",
//       },
//       {
//         id: "Katsina-Ala West Sensor",
//         name: "Katsina-Ala West",
//         coordinates: { lat: 7.1667, lng: 9.2833 },
//         status: "inactive",
//         lastUpdate: new Date(Date.now() - 300000),
//         batteryLevel: 45,
//         signalStrength: 0,
//         sensorType: "acoustic",
//       },
//       {
//         id: "Vandeikya South Sensor",
//         name: "Vandeikya South",
//         coordinates: { lat: 6.7833, lng: 9.0667 },
//         status: "active",
//         lastUpdate: new Date(),
//         batteryLevel: 95,
//         signalStrength: 95,
//         sensorType: "seismic",
//       },
//     ];

//     setSensors(initialSensors);
//   }, []);

//   // Generate initial threats (unchanged)
//   useEffect(() => {
//     if (sensors.length === 0) return;

//     const initialThreats: Threat[] = [
//       {
//         id: "T001",
//         sensorId: "S002",
//         type: "armed_group",
//         severity: "critical",
//         location: {
//           lat: 7.2,
//           lng: 8.8,
//           name: "Border Perimeter North",
//         },
//         timestamp: new Date(Date.now() - 120000),
//         description:
//           "Armed group of 8-10 individuals detected approaching checkpoint. Heavy weapons visible.",
//         personnel: 10,
//         status: "active",
//         movement: {
//           currentPosition: { lat: 7.2, lng: 8.8 },
//           previousPosition: { lat: 7.15, lng: 8.75 },
//           direction: "inbound",
//           speed: 3.5,
//           trajectory: [
//             { lat: 7.1, lng: 8.7 },
//             { lat: 7.15, lng: 8.75 },
//             { lat: 7.2, lng: 8.8 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 10,
//         confidence: 95,
//       },
//       {
//         id: "T002",
//         sensorId: "S001",
//         type: "vehicle_movement",
//         severity: "medium",
//         location: {
//           lat: 7.8,
//           lng: 8.2,
//           name: "Border Perimeter West",
//         },
//         timestamp: new Date(Date.now() - 300000),
//         description:
//           "Convoy of 3 unmarked vehicles moving towards border crossing at unusual hour.",
//         personnel: 6,
//         status: "investigating",
//         movement: {
//           currentPosition: { lat: 7.8, lng: 8.2 },
//           previousPosition: { lat: 7.85, lng: 8.15 },
//           direction: "outbound",
//           speed: 45,
//           trajectory: [
//             { lat: 7.9, lng: 8.1 },
//             { lat: 7.85, lng: 8.15 },
//             { lat: 7.8, lng: 8.2 },
//           ],
//           lastUpdate: new Date(),
//         },
//         estimatedSize: 6,
//         confidence: 82,
//       },
//     ];

//     setThreats(initialThreats);
//   }, [sensors]);

//   // Threat movement simulation with prediction (updated with simulationSpeed)
//   const updateThreatMovement = useCallback(() => {
//     setThreats((prevThreats) =>
//       prevThreats.map((threat) => {
//         if (threat.status !== "active") return threat;

//         const currentPos = threat.movement.currentPosition;
//         const isInside = isPointInPolygon(currentPos, boundaryCoords);

//         let newTarget: Coordinates;
//         let newDirection: MovementDirection;
//         let newSpeed = threat.movement.speed;

//         switch (threat.type) {
//           case "armed_group":
//             if (isInside) {
//               newTarget =
//                 Math.random() > 0.7
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "outbound";
//               newSpeed = 2 + Math.random() * 3;
//             } else {
//               newTarget =
//                 Math.random() > 0.5
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.1,
//                       maxLat: bounds.maxLat + 0.1,
//                       minLng: bounds.minLng - 0.1,
//                       maxLng: bounds.maxLng + 0.1,
//                     });
//               newDirection = "inbound";
//               newSpeed = 1.5 + Math.random() * 2.5;
//             }
//             break;

//           case "vehicle_movement":
//             if (isInside) {
//               newTarget = generateRandomPoint({
//                 minLat: bounds.minLat - 0.3,
//                 maxLat: bounds.maxLat + 0.3,
//                 minLng: bounds.minLng - 0.3,
//                 maxLng: bounds.maxLng + 0.3,
//               });
//               newDirection = "outbound";
//             } else {
//               newTarget =
//                 Math.random() > 0.6
//                   ? generateRandomPoint(bounds)
//                   : generateRandomPoint({
//                       minLat: bounds.minLat - 0.2,
//                       maxLat: bounds.maxLat + 0.2,
//                       minLng: bounds.minLng - 0.2,
//                       maxLng: bounds.maxLng + 0.2,
//                     });
//               newDirection = "inbound";
//             }
//             newSpeed = 25 + Math.random() * 35;
//             break;

//           default:
//             newTarget = generateRandomPoint({
//               minLat: bounds.minLat - 0.1,
//               maxLat: bounds.maxLat + 0.1,
//               minLng: bounds.minLng - 0.1,
//               maxLng: bounds.maxLng + 0.1,
//             });
//             newDirection = isInside ? "outbound" : "inbound";
//             newSpeed = 1 + Math.random() * 4;
//         }

//         const newPosition = movePointTowardTarget(
//           currentPos,
//           newTarget,
//           newSpeed,
//           simulationSpeed
//         );
//         const predictedPosition = movePointTowardTarget(
//           newPosition,
//           newTarget,
//           newSpeed,
//           60000
//         );

//         return {
//           ...threat,
//           predictedPosition,
//           movement: {
//             currentPosition: newPosition,
//             previousPosition: currentPos,
//             direction: newDirection,
//             speed: newSpeed,
//             trajectory: [...threat.movement.trajectory.slice(-9), newPosition],
//             lastUpdate: new Date(),
//           },
//           location: {
//             ...threat.location,
//             lat: newPosition.lat,
//             lng: newPosition.lng,
//           },
//         };
//       })
//     );
//   }, [boundaryCoords, bounds, simulationSpeed]);

//   const generateNewThreat = useCallback((): Threat | null => {
//     if (sensors.length === 0) return null;

//     const threatTypes: ThreatType[] = [
//       "intrusion",
//       "suspicious_activity",
//       "vehicle_movement",
//       "armed_group",
//     ];
//     const severities: ThreatSeverity[] = ["low", "medium", "high", "critical"];
//     const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];

//     const startPosition =
//       Math.random() > 0.5
//         ? generateRandomPoint(bounds)
//         : generateRandomPoint({
//             minLat: bounds.minLat - 0.2,
//             maxLat: bounds.maxLat + 0.2,
//             minLng: bounds.minLng - 0.2,
//             maxLng: bounds.maxLng + 0.2,
//           });

//     const threat: Threat = {
//       id: `T${Date.now()}`,
//       sensorId: randomSensor.id,
//       type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
//       severity: severities[Math.floor(Math.random() * severities.length)],
//       location: {
//         lat: startPosition.lat,
//         lng: startPosition.lng,
//         name: "Auto-detected Threat",
//       },
//       timestamp: new Date(),
//       description: "Automated threat detection by surveillance system.",
//       personnel: Math.floor(Math.random() * 12) + 1,
//       status: "active",
//       movement: {
//         currentPosition: startPosition,
//         previousPosition: startPosition,
//         direction: "stationary",
//         speed: 0,
//         trajectory: [startPosition],
//         lastUpdate: new Date(),
//       },
//       estimatedSize: Math.floor(Math.random() * 15) + 1,
//       confidence: Math.floor(Math.random() * 40) + 60,
//     };

//     if (
//       ["high", "critical"].includes(threat.severity) &&
//       soundEnabled &&
//       audioRef.current
//     ) {
//       audioRef.current.play().catch(console.error);
//       setNotifications((prev) =>
//         [
//           ...prev,
//           {
//             id: threat.id,
//             message: `New ${threat.severity.toUpperCase()} threat detected: ${
//               THREAT_TYPES[threat.type].label
//             }`,
//             severity: threat.severity,
//           },
//         ].slice(-5)
//       );
//     }

//     return threat;
//   }, [sensors, bounds, soundEnabled]);

//   // Simulation loop (unchanged)
//   useEffect(() => {
//     if (!isSimulationRunning) return;

//     setConnectionStatus("connected");

//     simulationIntervalRef.current = setInterval(() => {
//       setSensors((prev) =>
//         prev.map((sensor) => ({
//           ...sensor,
//           lastUpdate: new Date(),
//           batteryLevel: Math.max(20, sensor.batteryLevel - Math.random() * 0.1),
//           signalStrength: Math.max(
//             0,
//             Math.min(100, sensor.signalStrength + (Math.random() - 0.5) * 5)
//           ),
//         }))
//       );

//       updateThreatMovement();

//       if (Math.random() < 0.05) {
//         const newThreat = generateNewThreat();
//         if (newThreat) {
//           setThreats((prev) => [newThreat, ...prev.slice(0, 19)]);
//         }
//       }

//       setThreats((prev) =>
//         prev.filter(
//           (threat) =>
//             threat.status !== "resolved" ||
//             Date.now() - threat.timestamp.getTime() < 300000
//         )
//       );
//     }, simulationSpeed);

//     return () => {
//       if (simulationIntervalRef.current) {
//         clearInterval(simulationIntervalRef.current);
//       }
//     };
//   }, [isSimulationRunning, updateThreatMovement, generateNewThreat, sensors, simulationSpeed]);

//   // Auto-dismiss notifications (unchanged)
//   useEffect(() => {
//     if (notifications.length > 0) {
//       const timer = setTimeout(() => {
//         setNotifications((prev) => prev.slice(1));
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [notifications]);

//   const getSeverityColor = (severity: ThreatSeverity): string => {
//     return `${SEVERITY_CONFIG[severity].bgColor} text-white`;
//   };

//   const getStatusColor = (status: SensorStatus): string => {
//     const colorMap: Record<SensorStatus, string> = {
//       active: "text-green-400",
//       inactive: "text-red-400",
//       alert: "text-orange-400",
//       maintenance: "text-yellow-400",
//     };
//     return colorMap[status];
//   };

//   const getMovementIcon = (direction: MovementDirection): string => {
//     const icons: Record<MovementDirection, string> = {
//       inbound: "↗️",
//       outbound: "↙️",
//       lateral: "↔️",
//       stationary: "⏹️",
//     };
//     return icons[direction];
//   };

//   const activeCriticalThreats = useMemo(
//     () =>
//       threats.filter((t) => t.severity === "critical" && t.status === "active"),
//     [threats]
//   );

//   const activeThreats = useMemo(
//     () => threats.filter((t) => t.status === "active"),
//     [threats]
//   );

//   const activeSensors = useMemo(
//     () => sensors.filter((s) => s.status === "active"),
//     [sensors]
//   );

//   return (
//     <div className="min-h-screen bg-slate-900 text-white relative">
//       {/* Audio element for alerts (unchanged) */}
//       <audio ref={audioRef} preload="auto">
//         <source
//           src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdAkWRzO+8bSMELH7I79+STApSou7gylUfBhNztu/7uWsFLXjK7dyGOhgWSa/q2qBNCAhxue7/ol4GFWq37LiALgcVdMvq7rliFQZGoOs1t2QNCW+z6v5vKwgacaTt8LpgByl6yO1yMxYNUrHq87RsDBR4p+n5oVIGDW6y69x7NIYOUbLqzZA6BQ93s/Psp1MDBnSo5NqBOAYVaqTp67VhBSp8xs+GNwgSb7Ps6bVhBChxw++wYBoGIneqw/K8YhQFLXvK5dB7MgwPcqHq5q5WEQNZ0n7N50QdCk1pSKq9aUdBgT1nTh2JDQxhsjN7Y"
//           type="audio/wav"
//         />
//       </audio>

//       {/* In-app notifications (unchanged) */}
//       <div className="absolute top-20 right-4 z-20 space-y-2">
//         {notifications.map((notif) => (
//           <div
//             key={notif.id}
//             className={`p-4 rounded shadow-lg text-white transform transition-all duration-300 ease-in-out animate-slide-in ${
//               notif.severity === "critical" ? "bg-red-600" : "bg-orange-600"
//             }`}
//           >
//             {notif.message}
//           </div>
//         ))}
//       </div>

//       {/* Header (enhanced with CV status) */}
//       <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Shield className="w-8 h-8 text-blue-400" />
//             <div>
//               <h1 className="text-2xl font-bold">
//                 Enhanced Border Surveillance (YOLOv7 + OpenCV.js)
//               </h1>
//               <p className="text-slate-400">
//                 Benue State - Real-time Threat Tracking
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div
//                 className={`w-3 h-3 rounded-full ${
//                   connectionStatus === "connected"
//                     ? "bg-green-400 animate-pulse"
//                     : "bg-red-400"
//                 }`}
//               />
//               <span className="text-sm text-slate-400 capitalize">
//                 {connectionStatus}
//               </span>
//             </div>
//             <div className="flex items-center space-x-2 text-xs">
//               <div
//                 className={`w-2 h-2 rounded-full ${
//                   aiDetectionEnabled ? "bg-green-400" : "bg-gray-600"
//                 }`}
//               />
//               <span>YOLO Active</span>
//             </div>
//             <div className="flex items-center space-x-2 text-xs">
//               <div
//                 className={`w-2 h-2 rounded-full ${
//                   cvLoaded ? "bg-green-400" : "bg-yellow-400"
//                 }`}
//               />
//               <span>OpenCV Ready</span>
//             </div>

//             <button
//               onClick={() => setIsSimulationRunning(!isSimulationRunning)}
//               className={`px-3 py-1 rounded text-sm ${
//                 isSimulationRunning
//                   ? "bg-red-600 hover:bg-red-500"
//                   : "bg-green-600 hover:bg-green-500"
//               }`}
//             >
//               {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//             </button>

//             <button
//               onClick={() => setSoundEnabled(!soundEnabled)}
//               className={`p-2 rounded-lg ${
//                 soundEnabled
//                   ? "bg-blue-600 text-white"
//                   : "bg-slate-600 text-slate-300"
//               }`}
//             >
//               {soundEnabled ? (
//                 <Volume2 className="w-5 h-5" />
//               ) : (
//                 <VolumeX className="w-5 h-5" />
//               )}
//             </button>

//             <div className="text-right">
//               <div className="text-sm font-medium">
//                 {new Date().toLocaleTimeString()}
//               </div>
//               <div className="text-xs text-slate-400">
//                 {new Date().toLocaleDateString()}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Critical Alert Banner (unchanged) */}
//       {activeCriticalThreats.length > 0 && (
//         <Alert className="px-6 py-3 bg-red-900 border-red-700 text-red-100 animate-pulse">
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold">
//                 CRITICAL ALERT: {activeCriticalThreats.length} active critical
//                 threat
//                 {activeCriticalThreats.length > 1 ? "s" : ""} detected
//               </span>
//               <Bell className="w-5 h-5 animate-bounce" />
//             </div>
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="flex flex-1">
//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           {/* Statistics Cards (updated system status) */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">Active Sensors</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {activeSensors.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     of {sensors.length} total
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
//                     {activeThreats.length}
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     {activeCriticalThreats.length} critical
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
//                   <p className="text-xs text-slate-500">across all threats</p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </div>

//             <div className="bg-slate-800 rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-slate-400 text-sm">System Status</p>
//                   <p className="text-lg font-bold text-green-400">
//                     Operational
//                   </p>
//                   <p className="text-xs text-slate-500">
//                     YOLOv7 + OpenCV.js Loaded
//                   </p>
//                 </div>
//                 <Settings className="w-8 h-8 text-green-400" />
//               </div>
//             </div>
//           </div>

//           {/* Map (unchanged) */}
//           <div className="bg-slate-800 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-lg font-semibold flex items-center space-x-2">
//                 <MapPin className="w-5 h-5" />
//                 <span>Benue State Border Map - Live Tracking</span>
//               </h2>
//               <div className="flex space-x-4">
//                 <div className="flex items-center space-x-1 text-sm text-blue-400">
//                   <div className="w-3 h-3 bg-blue-400 rounded"></div>
//                   <span>Sensors</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-red-400">
//                   <div className="w-3 h-3 bg-red-400 rounded-full"></div>
//                   <span>Active Threats</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-sm text-purple-400">
//                   <Navigation className="w-3 h-3" />
//                   <span>Movement Trails</span>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-slate-900 rounded-lg h-[850px] relative overflow-hidden border border-slate-600">
//               <MapContainer
//                 center={[7.5, 8.5]}
//                 zoom={9}
//                 style={{ height: "100%", width: "100%" }}
//                 maxBounds={[
//                   [bounds.minLat - 0.5, bounds.minLng - 0.5],
//                   [bounds.maxLat + 0.5, bounds.maxLng + 0.5],
//                 ]}
//               >
//                 <TileLayer
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 />
//                 <Polygon
//                   positions={boundaryCoords.map(
//                     ([lng, lat]) => [lat, lng] as LatLngExpression
//                   )}
//                   pathOptions={{ color: "blue", dashArray: "5, 5" }}
//                 />
//                 <MapControls
//                   threats={threats}
//                   showSensors={showSensors}
//                   setShowSensors={setShowSensors}
//                   showThreats={showThreats}
//                   setShowThreats={setShowThreats}
//                   showHeatmap={showHeatmap}
//                   setShowHeatmap={setShowHeatmap}
//                   aiDetectionEnabled={aiDetectionEnabled}
//                   setAiDetectionEnabled={setAiDetectionEnabled}
//                   simulationSpeed={simulationSpeed}
//                   setSimulationSpeed={setSimulationSpeed}
//                 />
//                 {showSensors && (
//                   <MarkerClusterGroup>
//                     {sensors.map((sensor) => (
//                       <Marker
//                         key={sensor.id}
//                         position={[
//                           sensor.coordinates.lat,
//                           sensor.coordinates.lng,
//                         ]}
//                         icon={sensorIcon(sensor.status)}
//                       >
//                         <Popup>
//                           {sensor.name} - {sensor.status}
//                         </Popup>
//                         <Tooltip>{sensor.id}</Tooltip>
//                       </Marker>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showThreats && (
//                   <MarkerClusterGroup>
//                     {activeThreats.map((threat) => (
//                       <Fragment key={threat.id}>
//                         <Marker
//                           position={[
//                             threat.movement.currentPosition.lat,
//                             threat.movement.currentPosition.lng,
//                           ]}
//                           icon={threatIcon(threat.severity)}
//                           eventHandlers={{
//                             click: () => setSelectedThreat(threat),
//                           }}
//                         >
//                           <Popup>
//                             {THREAT_TYPES[threat.type].label}
//                             <br />
//                             Severity: {threat.severity}
//                             <br />
//                             Speed: {threat.movement.speed.toFixed(1)} km/h
//                           </Popup>
//                           <Tooltip direction="top">
//                             {THREAT_TYPES[threat.type].label}
//                           </Tooltip>
//                         </Marker>
//                         {threat.movement.trajectory.length > 1 && (
//                           <Polyline
//                             positions={threat.movement.trajectory.map(
//                               (pos) => [pos.lat, pos.lng] as LatLngExpression
//                             )}
//                             pathOptions={{ color: "purple", dashArray: "2,2" }}
//                           />
//                         )}
//                         {threat.predictedPosition && (
//                           <>
//                             <Polyline
//                               positions={
//                                 [
//                                   [
//                                     threat.movement.currentPosition.lat,
//                                     threat.movement.currentPosition.lng,
//                                   ],
//                                   [
//                                     threat.predictedPosition.lat,
//                                     threat.predictedPosition.lng,
//                                   ],
//                                 ] as LatLngExpression[]
//                               }
//                               pathOptions={{
//                                 color: "gray",
//                                 dashArray: "5,5",
//                                 opacity: 0.7,
//                               }}
//                             />
//                             <Marker
//                               position={[
//                                 threat.predictedPosition.lat,
//                                 threat.predictedPosition.lng,
//                               ]}
//                               icon={predictedIcon}
//                             >
//                               <Popup>Predicted Position (60s ahead)</Popup>
//                               <Tooltip>Predicted</Tooltip>
//                             </Marker>
//                           </>
//                         )}
//                       </Fragment>
//                     ))}
//                   </MarkerClusterGroup>
//                 )}
//                 {showHeatmap && (
//                   <HeatmapLayer
//                     points={
//                       heatmapData as Array<{
//                         lat: number;
//                         lng: number;
//                         value: number;
//                       }>
//                     }
//                     longitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lng}
//                     latitudeExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.lat}
//                     intensityExtractor={(p: {
//                       lat: number;
//                       lng: number;
//                       value: number;
//                     }) => p.value}
//                     radius={20}
//                     blur={15}
//                     maxZoom={18}
//                   />
//                 )}
//               </MapContainer>

//               {/* Simulation indicator (enhanced) */}
//               <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-800 rounded px-3 py-1 border border-slate-600 z-[1000]">
//                 <div
//                   className={`w-2 h-2 rounded-full ${
//                     isSimulationRunning
//                       ? "bg-green-400 animate-pulse"
//                       : "bg-red-400"
//                   }`}
//                 ></div>
//                 <span className="text-xs">
//                   {isSimulationRunning
//                     ? `Live Simulation (${simulationSpeed / 1000}s)`
//                     : "Simulation Paused"}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Video Feeds (optimized with OpenCV processing) */}
//           <div className="bg-slate-800 rounded-lg p-4">
//             <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//               <Camera className="w-5 h-5" />
//               <span>Live Video Feeds & Sensor Data (YOLO + OpenCV Real-time)</span>
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {sensors.map((sensor) => {
//                 const videoSrc = VIDEO_SOURCES[sensor.id] || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
//                 return (
//                   <div
//                     key={sensor.id}
//                     className="bg-slate-700 rounded-lg p-3 border border-slate-600"
//                   >
//                     <div className="bg-black rounded aspect-video mb-3 relative overflow-hidden">
//                       <video
//                         ref={(el) => {
//                           videoRefs.current[sensor.id] = el;
//                         }}
//                         autoPlay
//                         loop
//                         muted
//                         playsInline
//                         className="w-full h-full object-cover absolute top-0 left-0"
//                       >
//                         <source
//                           src={videoSrc}
//                           type="video/mp4"
//                         />
//                       </video>
//                       <canvas
//                         ref={(el) => {
//                           canvasRefs.current[sensor.id] = el;
//                         }}
//                         className="absolute top-0 left-0 pointer-events-none"
//                       />
//                       <div className="absolute top-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
//                         {sensor.sensorType.toUpperCase()} - {sensor.id}
//                       </div>
//                       {isSimulationRunning && (
//                         <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//                       )}
//                       {sensor.status === "alert" && (
//                         <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
//                       )}
//                     </div>

//                     <div className="space-y-2">
//                       <div className="flex justify-between items-center text-sm">
//                         <span className="text-slate-300">{sensor.name}</span>
//                         <span className={getStatusColor(sensor.status)}>
//                           {sensor.status.toUpperCase()}
//                         </span>
//                       </div>

//                       <div className="grid grid-cols-2 gap-2 text-xs">
//                         <div className="bg-slate-600 rounded p-1">
//                           <div className="text-slate-400">Battery</div>
//                           <div className="font-medium">
//                             {sensor.batteryLevel.toFixed(1)}%
//                           </div>
//                           <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
//                             <div
//                               className={`h-1 rounded-full ${
//                                 sensor.batteryLevel > 50
//                                   ? "bg-green-400"
//                                   : sensor.batteryLevel > 25
//                                   ? "bg-yellow-400"
//                                   : "bg-red-400"
//                               }`}
//                               style={{ width: `${sensor.batteryLevel}%` }}
//                             />
//                           </div>
//                         </div>

//                         <div className="bg-slate-600 rounded p-1">
//                           <div className="text-slate-400">Signal</div>
//                           <div className="font-medium">
//                             {sensor.signalStrength.toFixed(0)}%
//                           </div>
//                           <div className="flex space-x-1 mt-1">
//                             {[1, 2, 3, 4, 5].map((bar) => (
//                               <div
//                                 key={bar}
//                                 className={`flex-1 h-1 rounded ${
//                                   sensor.signalStrength >= bar * 20
//                                     ? "bg-green-400"
//                                     : "bg-slate-800"
//                                 }`}
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="text-xs text-slate-400">
//                         Last update: {sensor.lastUpdate.toLocaleTimeString()}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Enhanced Sidebar (unchanged) */}
//         <div className="w-96 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5" />
//             <span>Threat Intelligence</span>
//           </h2>

//           {/* Threat Filter (unchanged) */}
//           <div className="mb-4 space-y-2">
//             <div className="flex items-center space-x-2">
//               <Filter className="w-4 h-4" />
//               <label className="text-sm">Filter by Type:</label>
//             </div>
//             <select
//               value={selectedThreatType}
//               onChange={(e) => setSelectedThreatType(e.target.value as ThreatType | "all")}
//               className="w-full p-2 bg-slate-700 text-white rounded"
//             >
//               <option value="all">All Types</option>
//               {Object.keys(THREAT_TYPES).map((type) => (
//                 <option key={type} value={type}>
//                   {THREAT_TYPES[type as ThreatType].label}
//                 </option>
//               ))}
//             </select>
//             <div className="flex space-x-1 text-xs">
//               <button className="px-2 py-1 bg-red-600 text-white rounded flex-1">
//                 Critical
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
//                 High
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
//                 Medium
//               </button>
//               <button className="px-2 py-1 bg-slate-600 text-slate-300 rounded hover:bg-slate-500 flex-1">
//                 All
//               </button>
//             </div>
//           </div>

//           {/* Threat List */}
//           <div
//             className="space-y-3 mb-6"
//             style={{ maxHeight: "50vh", overflowY: "auto" }}
//           >
//             {filteredThreats
//               .sort(
//                 (a, b) =>
//                   SEVERITY_CONFIG[b.severity].priority -
//                   SEVERITY_CONFIG[a.severity].priority
//               )
//               .map((threat) => (
//                 <div
//                   key={threat.id}
//                   className={`bg-slate-700 rounded-lg p-3 cursor-pointer transition-all border
//                     ${
//                       selectedThreat?.id === threat.id
//                         ? "ring-2 ring-blue-400 border-blue-400"
//                         : "border-slate-600"
//                     }
//                     hover:bg-slate-600 hover:border-slate-500`}
//                   onClick={() => setSelectedThreat(threat)}
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       <span
//                         className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
//                           threat.severity
//                         )}`}
//                       >
//                         {threat.severity.toUpperCase()}
//                       </span>
//                       <span className="text-xs">
//                         {THREAT_TYPES[threat.type].icon}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-1 text-xs text-slate-400">
//                       <Clock className="w-3 h-3" />
//                       <span>
//                         {new Date(threat.timestamp).toLocaleTimeString()}
//                       </span>
//                     </div>
//                   </div>

//                   <h3 className="font-medium mb-1 text-sm">
//                     {THREAT_TYPES[threat.type].label}
//                   </h3>

//                   <p className="text-xs text-slate-300 mb-2 line-clamp-2">
//                     {threat.description}
//                   </p>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
//                     <span className="flex items-center space-x-1">
//                       <Navigation className="w-3 h-3" />
//                       <span>{threat.movement.direction}</span>
//                       <span>{getMovementIcon(threat.movement.direction)}</span>
//                     </span>
//                     <span>{threat.movement.speed.toFixed(1)} km/h</span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
//                     <span className="flex items-center space-x-1">
//                       <MapPin className="w-3 h-3" />
//                       <span>{threat.location.name}</span>
//                     </span>
//                     <span className="flex items-center space-x-1">
//                       <Users className="w-3 h-3" />
//                       <span>{threat.personnel}</span>
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs mb-2">
//                     <span className="text-slate-400">
//                       Confidence: {threat.confidence}%
//                     </span>
//                     <span
//                       className={`px-1 rounded ${
//                         threat.status === "active"
//                           ? "bg-red-800 text-red-200"
//                           : threat.status === "investigating"
//                           ? "bg-yellow-800 text-yellow-200"
//                           : "bg-green-800 text-green-200"
//                       }`}
//                     >
//                       {threat.status.toUpperCase()}
//                     </span>
//                   </div>

//                   <div className="flex space-x-1">
//                     <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 flex-1">
//                       Deploy
//                     </button>
//                     <button className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-500 flex-1">
//                       Investigate
//                     </button>
//                   </div>
//                 </div>
//               ))}
//           </div>

//           {/* System Status Panel (unchanged) */}
//           <div className="border-t border-slate-600 pt-4">
//             <h3 className="text-md font-semibold mb-3 flex items-center space-x-2">
//               <Radio className="w-4 h-4" />
//               <span>System Status</span>
//             </h3>

//             <div className="space-y-3">
//               <div className="bg-slate-700 rounded p-3">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm font-medium">Network Status</span>
//                   <span
//                     className={`text-xs px-2 py-1 rounded ${
//                       connectionStatus === "connected"
//                         ? "bg-green-800 text-green-200"
//                         : "bg-red-800 text-red-200"
//                     }`}
//                   >
//                     {connectionStatus.toUpperCase()}
//                   </span>
//                 </div>
//                 <div className="text-xs text-slate-400">
//                   Uptime: 99.8% | Latency: 12ms
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Sensor Network</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-green-400">Active:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "active").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">Alert:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "alert").length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Offline:</span>
//                     <span>
//                       {sensors.filter((s) => s.status === "inactive").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-700 rounded p-3">
//                 <div className="text-sm font-medium mb-2">Threat Analysis</div>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between">
//                     <span className="text-red-400">Critical:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "critical" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-orange-400">High:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) => t.severity === "high" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-yellow-400">Medium:</span>
//                     <span>
//                       {
//                         threats.filter(
//                           (t) =>
//                             t.severity === "medium" && t.status === "active"
//                         ).length
//                       }
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-slate-400">Resolved:</span>
//                     <span>
//                       {threats.filter((t) => t.status === "resolved").length}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Threat Detail Modal (unchanged) */}
//       {selectedThreat && (
//         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center space-x-3">
//                 <h2 className="text-xl font-bold">
//                   Threat Intelligence Report
//                 </h2>
//                 <span
//                   className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(
//                     selectedThreat.severity
//                   )}`}
//                 >
//                   {selectedThreat.severity.toUpperCase()}
//                 </span>
//               </div>
//               <button
//                 onClick={() => setSelectedThreat(null)}
//                 className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Basic Information
//                   </h3>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <label className="text-slate-400">Threat ID</label>
//                       <p className="font-medium">{selectedThreat.id}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Sensor ID</label>
//                       <p className="font-medium">{selectedThreat.sensorId}</p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Type</label>
//                       <p className="font-medium">
//                         {THREAT_TYPES[selectedThreat.type].icon}{" "}
//                         {THREAT_TYPES[selectedThreat.type].label}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Status</label>
//                       <p
//                         className={`font-medium ${
//                           selectedThreat.status === "active"
//                             ? "text-red-400"
//                             : selectedThreat.status === "investigating"
//                             ? "text-yellow-400"
//                             : "text-green-400"
//                         }`}
//                       >
//                         {selectedThreat.status.toUpperCase()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Movement Analysis
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Direction:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.direction}{" "}
//                         {getMovementIcon(selectedThreat.movement.direction)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Current Speed:</span>
//                       <span className="font-medium">
//                         {selectedThreat.movement.speed.toFixed(1)} km/h
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Estimated Size:</span>
//                       <span className="font-medium">
//                         {selectedThreat.estimatedSize} individuals
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-400">Confidence:</span>
//                       <span className="font-medium">
//                         {selectedThreat.confidence}%
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Threat Description
//                   </h3>
//                   <p className="text-slate-200 text-sm leading-relaxed">
//                     {selectedThreat.description}
//                   </p>
//                 </div>

//                 <div className="bg-slate-700 rounded p-4">
//                   <h3 className="font-semibold mb-3 text-blue-400">
//                     Location & Time
//                   </h3>
//                   <div className="space-y-2 text-sm">
//                     <div>
//                       <label className="text-slate-400">Location</label>
//                       <p className="font-medium">
//                         {selectedThreat.location.name}
//                       </p>
//                       <p className="text-xs text-slate-500">
//                         {selectedThreat.location.lat.toFixed(4)},{" "}
//                         {selectedThreat.location.lng.toFixed(4)}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">First Detected</label>
//                       <p className="font-medium">
//                         {selectedThreat.timestamp.toLocaleString()}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="text-slate-400">Last Update</label>
//                       <p className="font-medium">
//                         {selectedThreat.movement.lastUpdate.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-600">
//               <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center space-x-2">
//                 <AlertTriangle className="w-4 h-4" />
//                 <span>Deploy Emergency Response</span>
//               </button>
//               <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 flex items-center space-x-2">
//                 <Users className="w-4 h-4" />
//                 <span>Request Backup</span>
//               </button>
//               <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 flex items-center space-x-2">
//                 <Eye className="w-4 h-4" />
//                 <span>Mark Investigating</span>
//               </button>
//               <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
//                 Mark Resolved
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EnhancedBorderSurveillance;