# srv

Servicios backend de Vinclo. Hoy: tasks de ECS Fargate que extraen datos públicos y los normalizan.

```
src/common/                 # storage (S3 o disco), rutas, writer JSONL, logging
src/tasks/web_extractor/    # task `web-extractor`: un módulo por job en jobs/
src/tasks/normalize/        # task `normalize`: un módulo por dataset en datasets/
```

## Desarrollo local

Requiere Python 3.12+ y Poetry 2.x. Poetry crea el venv del proyecto en `srv/.venv`.

```bash
cd srv
poetry config virtualenvs.in-project true --local
poetry install
poetry run ruff check . && poetry run pytest

# Correr un job escribiendo en disco en vez de S3
poetry run web-extractor --list
poetry run web-extractor --job nashville-str-permits --upstream ./out/upstream
poetry run normalize --dataset leads --upstream ./out/upstream --downstream ./out/downstream
```

`--upstream` y `--downstream` aceptan `s3://bucket` o una carpeta local. En ECS vienen de las
variables `UPSTREAM_URI` y `DOWNSTREAM_URI`.

## Rutas en S3

```
s3://vinclo-upstream/raw/<job>/date=YYYY-MM-DD/run=<run-id>/data.jsonl
s3://vinclo-downstream/normalized/<dataset>/date=YYYY-MM-DD/<dataset>.csv
```

Cada línea de `data.jsonl` es `{job, run_id, extracted_at, source_url, data}`; `data` es el registro
tal cual lo entrega la fuente.

## Agregar un job

1. Crear `src/tasks/web_extractor/jobs/<nombre>.py` con una clase decorada con `@register`
   que implemente `extract(ctx) -> Iterator[Item]`.
2. Importarlo en `jobs/__init__.py`.
3. Agregar su schedule en `infra/live/prod/us-east-1/tasks/terragrunt.hcl`.

## Docker

```bash
docker build -t srv:dev srv
docker run --rm -v "$PWD/srv/out:/out" srv:dev web-extractor --job dbpr-fl-lodging --upstream /out/upstream
```
