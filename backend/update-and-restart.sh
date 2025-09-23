#!/bin/bash

# Quick update script for InvestIQ Backend
# This script copies updated files and restarts the service

set -e

# Configuration
PROJECT_ID="speedy-445810"
INSTANCE_NAME="investiq-backend"
ZONE="asia-south1-a"

echo "🔄 Updating InvestIQ Backend files and restarting service..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Get the external IP
echo "🌐 Getting instance IP..."
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

if [ -z "$EXTERNAL_IP" ]; then
    echo "❌ Could not get external IP for instance $INSTANCE_NAME"
    exit 1
fi

echo "📍 Instance IP: $EXTERNAL_IP"

# Create a temporary directory for files
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Copy all required files to temp directory
echo "📋 Copying files to temporary directory..."
cp main.py "$TEMP_DIR/"
cp agent_try.py "$TEMP_DIR/"
cp gemini_models.py "$TEMP_DIR/"
cp pdf_extract.py "$TEMP_DIR/"
cp requirements.txt "$TEMP_DIR/"
cp start.py "$TEMP_DIR/"

# SCP all files to the instance
echo "📤 Uploading files to instance..."
gcloud compute scp --recurse "$TEMP_DIR"/* $INSTANCE_NAME:~/ --zone=$ZONE

# SSH into the instance and update files + restart service
echo "🔧 Updating files and restarting service..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    echo '📋 Copying updated files...'
    sudo cp ~/main.py /opt/investiq/
    sudo cp ~/agent_try.py /opt/investiq/
    sudo cp ~/gemini_models.py /opt/investiq/
    sudo cp ~/pdf_extract.py /opt/investiq/
    sudo cp ~/requirements.txt /opt/investiq/
    sudo cp ~/start.py /opt/investiq/
    
    echo '🔄 Restarting service...'
    sudo systemctl restart investiq-backend
    
    echo '📊 Checking service status...'
    sudo systemctl status investiq-backend --no-pager
"

# Clean up temporary directory
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Update completed successfully!"
echo "🌐 Your backend should be available at: http://$EXTERNAL_IP:8000"
echo ""
echo "📝 To check the service status:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo systemctl status investiq-backend'"
echo ""
echo "📝 To view logs:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo journalctl -u investiq-backend -f'"
