from __future__ import annotations

from io import BytesIO

from PIL import Image


def test_photo_upload_rejects_non_image(client):
    trip = client.post("/api/trips", json={"title": "Kyoto"}).json()

    response = client.post(
        f"/api/trips/{trip['id']}/photos",
        files=[("files", ("notes.txt", b"not an image", "text/plain"))],
    )

    assert response.status_code == 400


def test_photo_routes_return_404_for_missing_trip(client):
    response = client.get("/api/trips/999/photos")
    assert response.status_code == 404

    upload_response = client.post(
        "/api/trips/999/photos",
        files=[("files", ("missing.jpg", _image_bytes(), "image/jpeg"))],
    )
    assert upload_response.status_code == 404


def test_photo_upload_accepts_image_and_stores_metadata(client):
    trip = client.post("/api/trips", json={"title": "Kyoto"}).json()
    image = BytesIO()
    Image.new("RGB", (8, 8), color="red").save(image, format="JPEG")
    image.seek(0)

    response = client.post(
        f"/api/trips/{trip['id']}/photos",
        files=[("files", ("temple.jpg", image.getvalue(), "image/jpeg"))],
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["filename"] == "temple.jpg"
    assert payload[0]["image_url"].startswith("/uploads/trip_")

    list_response = client.get(f"/api/trips/{trip['id']}/photos")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def _image_bytes() -> bytes:
    image = BytesIO()
    Image.new("RGB", (8, 8), color="red").save(image, format="JPEG")
    return image.getvalue()
