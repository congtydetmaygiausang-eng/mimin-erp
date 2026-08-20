FROM python:3.12.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

RUN groupadd --system companyreader \
    && useradd --system --gid companyreader --home-dir /app companyreader

COPY services/company-reader/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --requirement requirements.txt

COPY services/company-reader/company_reader ./company_reader

USER companyreader
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','10000')+'/readyz',timeout=3)" || exit 1

CMD ["sh", "-c", "uvicorn company_reader.production_app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1 --no-access-log"]
