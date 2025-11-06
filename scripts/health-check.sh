#!/bin/bash

# Health Check Script for Ambulance Manager
# This script checks the health of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost"
BACKEND_URL="http://localhost:3001"
DATABASE_HOST="localhost"
DATABASE_PORT="5432"
REDIS_HOST="localhost"
REDIS_PORT="6379"

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

# Check if service is running
check_service() {
    local service_name="$1"
    local check_command="$2"
    
    log_info "Checking $service_name..."
    
    if eval "$check_command" >/dev/null 2>&1; then
        log_success "$service_name is healthy"
        return 0
    else
        log_error "$service_name is not responding"
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    log_info "Checking Docker containers..."
    
    local containers=("ambulance_postgres" "ambulance_backend" "ambulance_frontend" "ambulance_redis" "ambulance_nginx")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            log_success "Container $container is running"
        else
            log_error "Container $container is not running"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == true ]]; then
        return 0
    else
        return 1
    fi
}

# Check database connection
check_database() {
    check_service "Database" "docker exec ambulance_postgres pg_isready -U postgres"
}

# Check Redis connection
check_redis() {
    check_service "Redis" "docker exec ambulance_redis redis-cli ping"
}

# Check backend API
check_backend() {
    check_service "Backend API" "curl -f $BACKEND_URL/api/health"
}

# Check frontend
check_frontend() {
    check_service "Frontend" "curl -f $FRONTEND_URL/health"
}

# Check SSL certificate (if configured)
check_ssl() {
    if [[ -f "./ssl/cert.pem" ]] && [[ -f "./ssl/key.pem" ]]; then
        log_info "Checking SSL certificate..."
        
        local cert_expiry=$(openssl x509 -in ./ssl/cert.pem -noout -enddate | cut -d= -f2)
        local cert_expiry_epoch=$(date -d "$cert_expiry" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (cert_expiry_epoch - current_epoch) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            log_success "SSL certificate is valid (expires in $days_until_expiry days)"
        elif [[ $days_until_expiry -gt 0 ]]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
        else
            log_error "SSL certificate has expired"
            return 1
        fi
    else
        log_warning "SSL certificates not found"
    fi
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ $usage -lt 80 ]]; then
        log_success "Disk space is healthy (${usage}% used)"
    elif [[ $usage -lt 90 ]]; then
        log_warning "Disk space is getting low (${usage}% used)"
    else
        log_error "Disk space is critically low (${usage}% used)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    log_info "Checking memory usage..."
    
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [[ $usage -lt 80 ]]; then
        log_success "Memory usage is healthy (${usage}% used)"
    elif [[ $usage -lt 90 ]]; then
        log_warning "Memory usage is high (${usage}% used)"
    else
        log_error "Memory usage is critically high (${usage}% used)"
        return 1
    fi
}

# Check log files
check_logs() {
    log_info "Checking log files..."
    
    local log_files=(
        "./logs/nginx/access.log"
        "./logs/nginx/error.log"
        "./logs/app.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local size=$(du -h "$log_file" | cut -f1)
            log_success "Log file $log_file exists (size: $size)"
        else
            log_warning "Log file $log_file not found"
        fi
    done
}

# Check backup status
check_backups() {
    log_info "Checking backup status..."
    
    if [[ -d "./backup" ]]; then
        local backup_count=$(find ./backup -name "ambulance_manager_*.sql.gz" -type f | wc -l)
        local latest_backup=$(find ./backup -name "ambulance_manager_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [[ $backup_count -gt 0 ]]; then
            if [[ -n "$latest_backup" ]]; then
                local backup_age=$(find "$latest_backup" -printf '%T@' | awk '{print int((systime() - $1) / 86400)}')
                if [[ $backup_age -lt 2 ]]; then
                    log_success "Recent backup found: $(basename "$latest_backup") (age: ${backup_age} days)"
                else
                    log_warning "Backup is old: $(basename "$latest_backup") (age: ${backup_age} days)"
                fi
            fi
            log_success "Total backups: $backup_count"
        else
            log_warning "No backups found"
        fi
    else
        log_warning "Backup directory not found"
    fi
}

# Check application performance
check_performance() {
    log_info "Checking application performance..."
    
    # Check response times
    local backend_time=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/api/health")
    local frontend_time=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL/health")
    
    log_info "Backend response time: ${backend_time}s"
    log_info "Frontend response time: ${frontend_time}s"
    
    # Check if response times are acceptable (less than 2 seconds)
    if (( $(echo "$backend_time < 2" | bc -l) )); then
        log_success "Backend response time is acceptable"
    else
        log_warning "Backend response time is slow"
    fi
    
    if (( $(echo "$frontend_time < 2" | bc -l) )); then
        log_success "Frontend response time is acceptable"
    else
        log_warning "Frontend response time is slow"
    fi
}

# Generate health report
generate_report() {
    local report_file="./health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    log_info "Generating health report: $report_file"
    
    {
        echo "Ambulance Manager Health Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo
        
        echo "Docker Containers:"
        docker ps --filter "name=ambulance_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo
        
        echo "System Resources:"
        echo "Disk Usage:"
        df -h
        echo
        echo "Memory Usage:"
        free -h
        echo
        
        echo "Application Status:"
        echo "Backend: $BACKEND_URL/api/health"
        echo "Frontend: $FRONTEND_URL/health"
        echo
        
        echo "Recent Logs (last 10 lines):"
        if [[ -f "./logs/app.log" ]]; then
            tail -10 "./logs/app.log"
        fi
        
    } > "$report_file"
    
    log_success "Health report generated: $report_file"
}

# Main health check function
main() {
    log_info "Starting health check for Ambulance Manager..."
    echo
    
    local overall_status=0
    
    # Check all components
    check_docker_containers || overall_status=1
    check_database || overall_status=1
    check_redis || overall_status=1
    check_backend || overall_status=1
    check_frontend || overall_status=1
    check_ssl || overall_status=1
    check_disk_space || overall_status=1
    check_memory || overall_status=1
    check_logs
    check_backups
    check_performance
    
    echo
    if [[ $overall_status -eq 0 ]]; then
        log_success "All health checks passed! System is healthy."
    else
        log_error "Some health checks failed. Please review the issues above."
    fi
    
    # Generate report
    generate_report
    
    return $overall_status
}

# Handle script arguments
case "${1:-}" in
    "containers")
        check_docker_containers
        ;;
    "database")
        check_database
        ;;
    "redis")
        check_redis
        ;;
    "backend")
        check_backend
        ;;
    "frontend")
        check_frontend
        ;;
    "ssl")
        check_ssl
        ;;
    "resources")
        check_disk_space
        check_memory
        ;;
    "performance")
        check_performance
        ;;
    "report")
        generate_report
        ;;
    *)
        main
        ;;
esac
