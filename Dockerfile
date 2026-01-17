FROM --platform=$BUILDPLATFORM node:22-bookworm AS node-builder
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm install

COPY index.html postcss.config.js tailwind.config.js tsconfig.app.json tsconfig.json tsconfig.node.json vite.config.ts ./
COPY public/ public/ 
COPY frontend/ frontend/ 

COPY --from=rust-bindings-builder /code/bindings.ts /code/frontend/bindings.ts
RUN npm run build


FROM python:3.12-slim AS python-builder

RUN pip install uv
RUN apt update -y && apt-get install -y build-essential gcc libjpeg-dev zlib1g-dev libtiff-dev libfreetype6-dev liblcms2-dev libwebp-dev libopenjp2-7-dev libraqm-dev libxcb1-dev libavif-dev

WORKDIR /code
COPY pyproject.toml uv.lock /code/

RUN uv sync


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update -y && apt-get install curl -y

WORKDIR /code

COPY --from=node-builder /code/dist/ /code/dist/
COPY --from=python-builder /code/.venv /code/.venv

COPY backend /code/backend

ENV VIRTUAL_ENV=/code/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=3s --retries=3 \
    CMD curl --fail http://localhost:8080/healthz || exit 1

RUN mkdir -p /data && chmod 0777 /data
ENV BAMBUI_CACHE_PATH=/data/db.json

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
