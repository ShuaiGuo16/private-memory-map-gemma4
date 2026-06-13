from __future__ import annotations


def test_health_returns_app_and_model_info(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "Private Memory Map"
    assert payload["gemma_model"] == "gemma4:e4b-128k"
    assert payload["database"] == "sqlite"
