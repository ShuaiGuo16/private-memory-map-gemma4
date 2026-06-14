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
  const unlocatedCount = photos.length - locatedPhotos.length;
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
            zIndexOffset={selectedPhotoId === photo.id ? 900 : 0}
            eventHandlers={{ click: () => onSelectPhoto(photo.id) }}
          >
            <Popup className="memory-popup">
              <strong>{photo.analysis?.memory_caption || photo.filename}</strong>
              <p>{photo.analysis?.place_type || "GPS from EXIF metadata"}</p>
              <button type="button" onClick={() => onSelectPhoto(photo.id)}>
                Inspect photo
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {locatedPhotos.length === 0 ? (
        <div className="map-empty">
          <span aria-hidden="true" />
          <strong>No GPS trail yet</strong>
          <p>Photos without EXIF coordinates still become memories, but precise map pins only come from metadata.</p>
        </div>
      ) : null}
      {locatedPhotos.length > 0 && unlocatedCount > 0 ? (
        <div className="map-note">{unlocatedCount} photo{unlocatedCount === 1 ? "" : "s"} without GPS</div>
      ) : null}
    </div>
  );
}
