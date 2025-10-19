#!/bin/bash
# Make backup and disaster recovery scripts executable
# This script should be run on the Linux server after deployment

echo "Making backup and disaster recovery scripts executable..."

# Make backup scripts executable
chmod +x backup/backup-script.sh
chmod +x backup/restore-script.sh
chmod +x backup/verify-backup.sh

# Make disaster recovery scripts executable
chmod +x disaster-recovery/restore-procedures.sh
chmod +x disaster-recovery/backup-testing.sh

# Create backup directory if it doesn't exist
mkdir -p /backups/floworx
mkdir -p /var/log/floworx

# Set proper ownership (adjust as needed)
# chown -R floworx:floworx /backups/floworx
# chown -R floworx:floworx /var/log/floworx

echo "Scripts made executable successfully!"
echo "Backup directory: /backups/floworx"
echo "Log directory: /var/log/floworx"
