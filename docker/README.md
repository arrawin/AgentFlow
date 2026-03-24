# Docker Setup

## Quick Commands

### Start services
```bash
docker-compose up --build
```

### Stop services
```bash
docker-compose down
```

### Stop and remove all data
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart celery
```

### Rebuild after code changes
```bash
docker-compose up --build
```

## Troubleshooting

### Port already in use
If you get "port already in use" errors:
```bash
# Check what's using the port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Stop the process or change the port in docker-compose.yml
```

### Database connection errors
```bash
# Check if postgres is running
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up --build
```

### Module import errors
Make sure the working_dir is set correctly in docker-compose.yml:
```yaml
working_dir: /app
```

And the command uses relative imports:
```yaml
command: uvicorn main:app --host 0.0.0.0 --port 8000
```

NOT:
```yaml
command: uvicorn backend.main:app  # Wrong!
```
