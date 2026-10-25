# ---- Runtime ----
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

# 0.0.0.0 required for Render to route traffic in
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
