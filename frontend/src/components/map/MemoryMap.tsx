import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Photo } from "../../api/client";

type MemoryMapProps = {
  photos: Photo[];
  selectedPhotoId: number | null;
  onSelectPhoto: (photoId: number) => void;
};

export function MemoryMap({
  photos,
  selectedPhotoId,
  onSelectPhoto
}: MemoryMapProps) {
  const locatedPhotos = photos.filter(
    (photo) => photo.latitude !== null && photo.longitude !== null
  );
  const center: LatLngExpression =
    locatedPhotos.length > 0
      ? [locatedPhotos[0].latitude!, locatedPhotos[0].longitude!]
      : [37.8, -96.9];

  return (
    <div className="map-frame">
      <MapContainer
        key={`${center[0]}-${center[1]}-${locatedPhotos.length}`}
        center={center}
        zoom={locatedPhotos.length > 0 ? 12 : 4}
        scrollWheelZoom
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locatedPhotos.map((photo) => (
          <Marker
            key={photo.id}
            position={[photo.latitude!, photo.longitude!]}
            eventHandlers={{ click: () => onSelectPhoto(photo.id) }}
          >
            <Popup>
              <strong>{photo.filename}</strong>
              {selectedPhotoId === photo.id ? <p>Selected memory</p> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {locatedPhotos.length === 0 ? (
        <div className="map-empty">No GPS photos yet</div>
      ) : null}
    </div>
  );
}
