const { sequelize } = require('../src/config/database');
const { User, Client, Package } = require('../src/models');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ where: { email: 'admin@itobox.com' } });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await User.create({
        email: 'admin@itobox.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'ITOBOX',
        lastName: 'Administrator',
        phone: '+506-2222-1111',
        company: 'ITOBOX Corp',
        isEmailVerified: true,
        status: 'active'
      });
      
      console.log('✅ Admin user created');
      console.log('📧 Email: admin@itobox.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Show statistics
    const userCount = await User.count();
    const clientCount = await Client.count();
    const packageCount = await Package.count();
    
    console.log('\n📊 Database Statistics:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Clients: ${clientCount}`);
    console.log(`📦 Packages: ${packageCount}`);
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupDatabase;

// docker-compose.yml - Configuración de Docker para desarrollo
version: '3.8'

services:
  # Base de datos MySQL
  mysql:
    image: mysql:8.0
    container_name: itobox-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: itobox_courier
      MYSQL_USER: itobox_user
      MYSQL_PASSWORD: secure_password_2024
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./itobox-backend/scripts/database-setup.sql:/docker-entrypoint-initdb.d/001-setup.sql
    networks:
      - itobox-network
    command: --default-authentication-plugin=mysql_native_password

  # Redis para cache
  redis:
    image: redis:7-alpine
    container_name: itobox-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - itobox-network
    command: redis-server --appendonly yes

  # Backend API
  backend:
    build:
      context: ./itobox-backend
      dockerfile: Dockerfile
    container_name: itobox-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - PORT=5000
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=itobox_courier
      - DB_USER=itobox_user
      - DB_PASSWORD=secure_password_2024
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - JWT_REFRESH_SECRET=your-refresh-token-secret
      - CORS_ORIGIN=http://localhost:3000
    volumes:
      - ./itobox-backend:/app
      - /app/node_modules
      - uploads_data:/app/uploads
    depends_on:
      - mysql
      - redis
    networks:
      - itobox-network
    command: npm run dev

  # Frontend React
  frontend:
    build:
      context: ./itobox-frontend
      dockerfile: Dockerfile
    container_name: itobox-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
      - REACT_APP_WS_URL=ws://localhost:5000
      - REACT_APP_ENVIRONMENT=development
    volumes:
      - ./itobox-frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - itobox-network
    command: npm start

  # Nginx como reverse proxy (opcional para producción)
  nginx:
    image: nginx:alpine
    container_name: itobox-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - itobox-network
    profiles:
      - production

volumes:
  mysql_data:
  redis_data:
  uploads_data:

networks:
  itobox-network:
    driver: bridge

# itobox-backend/Dockerfile - Dockerfile para el backend
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    make \
    g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando de inicio
CMD ["npm", "start"]

# itobox-frontend/Dockerfile - Dockerfile para el frontend
FROM node:18-alpine as builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]

# itobox-backend/healthcheck.js - Health check para Docker
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  timeout: 2000
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('Health check error:', err);
  process.exit(1);
});

healthCheck.end();

# scripts/deploy.sh - Script de deployment
#!/bin/bash

set -e

echo "🚀 Starting ITOBOX deployment..."

# Variables
PROJECT_NAME="itobox-courier"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_info "Docker is running ✅"
}

# Verificar si docker-compose está disponible
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    log_info "Docker Compose is available ✅"
}

# Crear backup de la base de datos
backup_database() {
    if [ "$1" != "--skip-backup" ]; then
        log_info "Creating database backup..."
        mkdir -p $BACKUP_DIR
        
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        if docker-compose exec -T mysql mysqldump -u root -prootpassword itobox_courier > $BACKUP_FILE 2>/dev/null; then
            log_info "Database backup created: $BACKUP_FILE ✅"
        else
            log_warning "Could not create database backup (this is normal for first deployment)"
        fi
    fi
}

# Construir y desplegar
deploy() {
    log_info "Building and deploying containers..."
    
    # Pull latest images
    docker-compose pull
    
    # Build images
    docker-compose build --no-cache
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check if services are healthy
    check_services_health
}

# Verificar salud de los servicios
check_services_health() {
    log_info "Checking services health..."
    
    # Check MySQL
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword &>/dev/null; then
        log_info "MySQL is healthy ✅"
    else
        log_error "MySQL is not responding ❌"
        exit 1
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        log_info "Redis is healthy ✅"
    else
        log_error "Redis is not responding ❌"
        exit 1
    fi
    
    # Check Backend
    sleep 5
    if curl -s http://localhost:5000/health | grep -q "OK"; then
        log_info "Backend is healthy ✅"
    else
        log_error "Backend is not responding ❌"
        exit 1
    fi
    
    # Check Frontend
    if curl -s http://localhost:3000 > /dev/null; then
        log_info "Frontend is accessible ✅"
    else
        log_error "Frontend is not accessible ❌"
        exit 1
    fi
}

# Ejecutar migraciones y seeds
run_database_setup() {
    log_info "Running database setup..."
    
    # Wait for MySQL to be ready
    while ! docker-compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword &>/dev/null; do
        log_info "Waiting for MySQL to be ready..."
        sleep 2
    done
    
    # Run setup script
    if docker-compose exec -T backend npm run db:setup 2>/dev/null; then
        log_info "Database setup completed ✅"
    else
        log_info "Running manual database setup..."
        docker-compose exec -T backend node scripts/setup.js
    fi
}

# Mostrar información de deployment
show_deployment_info() {
    log_info "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   API Health: http://localhost:5000/health"
    echo ""
    echo "🔐 Demo Accounts:"
    echo "   Admin: admin@demo.com / demo123"
    echo "   Agent: agente@demo.com / demo123" 
    echo "   Client: cliente@demo.com / demo123"
    echo ""
    echo "🗄️ Database:"
    echo "   Host: localhost:3306"
    echo "   Database: itobox_courier"
    echo "   User: itobox_user"
    echo ""
    echo "📝 Logs:"
    echo "   View all: docker-compose logs -f"
    echo "   Backend: docker-compose logs -f backend"
    echo "   Frontend: docker-compose logs -f frontend"
    echo ""
    echo "🛑 Stop services: docker-compose down"
    echo "🔄 Restart: docker-compose restart"
}

# Función de limpieza
cleanup() {
    log_info "Cleaning up old images and containers..."
    docker system prune -f
    log_info "Cleanup completed ✅"
}

# Función principal
main() {
    echo "🏗️  ITOBOX Courier Deployment Script"
    echo "======================================"
    
    check_docker
    check_docker_compose
    
    # Parse arguments
    case "$1" in
        --production)
            log_info "Deploying in PRODUCTION mode"
            export COMPOSE_PROFILES=production
            ;;
        --cleanup)
            cleanup
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --production    Deploy with production profile"
            echo "  --skip-backup   Skip database backup"
            echo "  --cleanup       Clean up Docker images and containers"
            echo "  --help          Show this help message"
            exit 0
            ;;
    esac
    
    backup_database "$1"
    deploy
    run_database_setup
    show_deployment_info
    
    log_info "🚀 ITOBOX is ready to use!"
}

# Ejecutar función principal con argumentos
main "$@"