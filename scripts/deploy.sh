#!/bin/bash

# Ambulance Manager Deployment Script
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ambulance-manager"
BACKUP_DIR="./backup"
LOG_DIR="./logs"
ENV_FILE=".env.production"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env.production exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please create $ENV_FILE with the required environment variables"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR/nginx"
    mkdir -p "./ssl"
    
    log_success "Directories created"
}

# Backup existing data
backup_data() {
    log_info "Creating backup of existing data..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres ambulance_manager > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        log_success "Database backup created"
    else
        log_warning "No running containers found, skipping backup"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    
    docker-compose -f docker-compose.prod.yml pull
    
    log_success "Images pulled successfully"
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Stop existing services
    docker-compose -f docker-compose.prod.yml down
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up -d --build
    
    log_success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for database
    log_info "Waiting for database..."
    timeout 60 bash -c 'until docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres; do sleep 2; done'
    
    # Wait for backend
    log_info "Waiting for backend..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health; do sleep 2; done'
    
    # Wait for frontend
    log_info "Waiting for frontend..."
    timeout 60 bash -c 'until curl -f http://localhost/health; do sleep 2; done'
    
    log_success "All services are healthy"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

# Seed database (optional)
seed_database() {
    read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Seeding database..."
        docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
        log_success "Database seeded successfully"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo
    docker-compose -f docker-compose.prod.yml ps
    echo
    log_info "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:3001"
    echo "  Database: localhost:5432"
    echo "  Redis: localhost:6379"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    docker image prune -f
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment of $PROJECT_NAME..."
    
    check_root
    check_prerequisites
    create_directories
    backup_data
    pull_images
    deploy_services
    wait_for_services
    run_migrations
    seed_database
    show_status
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "You can now access the application at http://localhost"
}

# Handle script arguments
case "${1:-}" in
    "backup")
        check_prerequisites
        backup_data
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "stop")
        docker-compose -f docker-compose.prod.yml down
        ;;
    "restart")
        docker-compose -f docker-compose.prod.yml restart
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
