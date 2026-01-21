FROM python:3.11-slim

WORKDIR /app

# System deps (minimal). Build tools not required for psycopg2-binary.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching)
COPY requirements.txt requirements.txt
COPY requirements-postgres.txt requirements-postgres.txt
RUN pip install --no-cache-dir -r requirements.txt -r requirements-postgres.txt

# Copy app
COPY . .

EXPOSE 8000

# Run migrations then start API
CMD ["sh", "-lc", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

