"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Map({ attendance }: any) {
  const center: L.LatLngExpression = [23.6850, 90.3563];

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
{/*  src="https://ui-avatars.com/api/?name=${record.employees?.name}"  */}
          {attendance.map((record: any) => {

              const icon = L.divIcon({
                  html: `
      <img 
        
        src="${record.employees?.avatar_url}"
        style="width:40px;height:40px;border-radius:50%;border:2px solid #3b82f6;"
      />
    `,
                  className: "",
                  iconSize: [40, 40],
              });

              const position: L.LatLngExpression = [
                  record.time_in_lat,
                  record.time_in_lng,
              ];

              const workingHours = record.time_out
                  ? (
                      (new Date(record.time_out).getTime() -
                          new Date(record.time_in).getTime()) /
                      (1000 * 60 * 60)
                  ).toFixed(2)
                  : "-";

              return (
                  <Marker key={record.id} position={position} icon={icon}>
                      <Popup>
                          <div className="text-black space-y-2">
                              <img
                                  src={record.time_in_photo}
                                  className="w-40 rounded"
                              />
                              <div><strong>Name:</strong> {record.employees?.name}</div>
                              <div><strong>Time In:</strong> {record.time_in}</div>
                              <div><strong>Time Out:</strong> {record.time_out || "-"}</div>
                              <div><strong>Working Hours:</strong> {workingHours}</div>
                          </div>
                      </Popup>
                  </Marker>
              );
          })}
    </MapContainer>
  );
}