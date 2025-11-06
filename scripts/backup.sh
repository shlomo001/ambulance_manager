#!/bin/bash

# Database Backup Script for Ambulance Manager
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backup"
DB_NAME="${POSTGRES_DB:-ambulance_manager}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-postgres}"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Create database backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/ambulance_manager_$timestamp.sql"
    local backup_file_compressed="$backup_file.gz"
    
    log_info "Creating database backup..."
    log_info "Database: $DB_NAME"
    log_info "Host: $DB_HOST"
    log_info "User: $DB_USER"
    
    # Create the backup
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --create \
        > "$backup_file" 2>/dev/null; then
        
        # Compress the backup
        gzip "$backup_file"
        
        log_success "Backup created successfully: $backup_file_compressed"
        
        # Get backup size
        local backup_size=$(du -h "$backup_file_compressed" | cut -f1)
        log_info "Backup size: $backup_size"
        
        return 0
    else
        log_error "Failed to create backup"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "ambulance_manager_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -eq 0 ]]; then
        log_info "No old backups to clean up"
    else
        log_success "Cleaned up $deleted_count old backup(s)"
    fi
}

# List available backups
list_backups() {
    log_info "Available backups:"
    echo
    
    if [[ -d "$BACKUP_DIR" ]] && [[ -n "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]]; then
        ls -lah "$BACKUP_DIR"/ambulance_manager_*.sql.gz 2>/dev/null | while read -r line; do
            echo "  $line"
        done
    else
        log_warning "No backups found in $BACKUP_DIR"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        log_error "Please specify a backup file to restore"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warning "This will restore the database from backup: $backup_file"
    log_warning "This action will REPLACE all current data!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    log_info "Restoring database from backup..."
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        # Restore from compressed backup
        if gunzip -c "$backup_file" | psql -h "$DB_HOST" -U "$DB_USER" -d postgres; then
            log_success "Database restored successfully from compressed backup"
        else
            log_error "Failed to restore database from compressed backup"
            return 1
        fi
    else
        # Restore from uncompressed backup
        if psql -h "$DB_HOST" -U "$DB_USER" -d postgres < "$backup_file"; then
            log_success "Database restored successfully"
        else
            log_error "Failed to restore database"
            return 1
        fi
    fi
}

# Test backup integrity
test_backup() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        log_error "Please specify a backup file to test"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Testing backup integrity: $backup_file"
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -t "$backup_file"; then
            log_success "Compressed backup file is valid"
        else
            log_error "Compressed backup file is corrupted"
            return 1
        fi
    else
        # For uncompressed files, we can only check if they're readable
        if [[ -r "$backup_file" ]]; then
            log_success "Backup file is readable"
        else
            log_error "Backup file is not readable"
            return 1
        fi
    fi
}

# Send backup to remote storage (example with S3)
upload_to_s3() {
    local backup_file="$1"
    local s3_bucket="${S3_BACKUP_BUCKET:-ambulance-manager-backups}"
    
    if [[ -z "$backup_file" ]]; then
        log_error "Please specify a backup file to upload"
        return 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        return 1
    fi
    
    log_info "Uploading backup to S3: s3://$s3_bucket/$(basename "$backup_file")"
    
    if aws s3 cp "$backup_file" "s3://$s3_bucket/$(basename "$backup_file")"; then
        log_success "Backup uploaded to S3 successfully"
    else
        log_error "Failed to upload backup to S3"
        return 1
    fi
}

# Main backup function
main() {
    log_info "Starting backup process..."
    
    create_backup_dir
    
    if create_backup; then
        cleanup_old_backups
        log_success "Backup process completed successfully"
        
        # Optional: Upload to S3 if configured
        if [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
            local latest_backup=$(ls -t "$BACKUP_DIR"/ambulance_manager_*.sql.gz 2>/dev/null | head -n1)
            if [[ -n "$latest_backup" ]]; then
                upload_to_s3 "$latest_backup"
            fi
        fi
    else
        log_error "Backup process failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "create")
        main
        ;;
    "list")
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "test")
        test_backup "$2"
        ;;
    "cleanup")
        create_backup_dir
        cleanup_old_backups
        ;;
    "upload")
        upload_to_s3 "$2"
        ;;
    *)
        echo "Usage: $0 {create|list|restore|test|cleanup|upload}"
        echo
        echo "Commands:"
        echo "  create    - Create a new backup"
        echo "  list      - List available backups"
        echo "  restore   - Restore from backup (specify file)"
        echo "  test      - Test backup integrity (specify file)"
        echo "  cleanup   - Clean up old backups"
        echo "  upload    - Upload backup to S3 (specify file)"
        echo
        echo "Examples:"
        echo "  $0 create"
        echo "  $0 list"
        echo "  $0 restore /backup/ambulance_manager_20240115_120000.sql.gz"
        echo "  $0 test /backup/ambulance_manager_20240115_120000.sql.gz"
        echo "  $0 upload /backup/ambulance_manager_20240115_120000.sql.gz"
        exit 1
        ;;
esac
