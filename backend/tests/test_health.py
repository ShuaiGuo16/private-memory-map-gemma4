from __future__ import annotations


def test_health_returns_app_and_model_info(client, monkeypatch):
    from backend.app.api.routes import health
    from backend.app.workflows.client import OllamaModelStatus

    monkeypatch.setattr(
        health,
        "check_ollama_model",
        lambda settings: OllamaModelStatus(
            ollama_available=True,
            model_available=True,
            model_status="ready",
        ),
    )

    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "Private Memory Map"
    assert payload["gemma_model"] == "gemma4:e4b-128k"
    assert payload["ollama_available"] is True
    assert payload["model_available"] is True
    assert payload["model_status"] == "ready"
    assert payload["model_error"] is None
    assert payload["database"] == "sqlite"
