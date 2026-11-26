# Una sola imagen para todos los tasks de ECS (web-extractor, normalize, ...).
# La versión de esta imagen debe coincidir con la de `playwright` en pyproject.toml.
FROM mcr.microsoft.com/playwright/python:v1.65.2-noble

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=2.5.2 \
    POETRY_VIRTUALENVS_CREATE=false \
    VIRTUAL_ENV=/opt/venv \
    PATH=/opt/venv/bin:$PATH

# Poetry vive en su propio venv; las dependencias de la app en /opt/venv.
# La imagen base no trae el módulo venv (python3.12-venv).
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3.12-venv \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/poetry \
    && /opt/poetry/bin/pip install "poetry==${POETRY_VERSION}" \
    && python3 -m venv /opt/venv

WORKDIR /app
COPY pyproject.toml poetry.lock README.md ./
RUN /opt/poetry/bin/poetry install --only main --no-root --no-interaction

COPY src ./src
RUN /opt/poetry/bin/poetry install --only main --no-interaction

ARG GIT_SHA=dev
ENV GIT_SHA=${GIT_SHA}

USER pwuser
CMD ["web-extractor", "--list"]
