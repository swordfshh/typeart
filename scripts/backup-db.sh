#!/bin/bash
# Daily SQLite backup for TypeArt
# Safe hot backup using sqlite3 .backup (WAL-compatible)

DB_PATH="/home/typeart/typeart/data/typeart.db"
BACKUP_DIR="/home/typeart/typeart/backups"
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/typeart-$DATE.db"
RETENTION_DAYS=7

if [ ! -f "$DB_PATH" ]; then
    echo "Database not found at $DB_PATH"
    exit 1
fi

umask 077
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
chmod 600 "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "typeart-*.db" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
