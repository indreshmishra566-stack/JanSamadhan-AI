FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && echo \"import os; from grievance_app.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'indreshmishra566@gmail.com', os.getenv('DEFAULT_ADMIN_PASSWORD', '12345678'), role='ADMIN')\" | python manage.py shell && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
