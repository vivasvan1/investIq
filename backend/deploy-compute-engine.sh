#!/bin/bash

# Deploy InvestIQ Backend to Google Compute Engine
# This script sets up a VM and deploys the application

set -e

# Configuration
PROJECT_ID="speedy-445810"  # Replace with your GCP project ID
INSTANCE_NAME="investiq-backend"
ZONE="asia-south1-a"  # Mumbai region
MACHINE_TYPE="e2-standard-2"  # 2 vCPUs, 8GB RAM - good for Ollama models
DISK_SIZE="50GB"  # Increased for model storage

echo "🚀 Deploying InvestIQ Backend to Compute Engine..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Create firewall rule for HTTP traffic
echo "🔥 Creating firewall rule..."
gcloud compute firewall-rules create allow-http \
    --allow tcp:8000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP traffic on port 8000" || echo "Firewall rule may already exist"

# Create the VM instance
echo "💻 Creating VM instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-standard \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server \
    --metadata-from-file startup-script=startup-script.sh

echo "⏳ Waiting for instance to be ready..."
sleep 60

# Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "✅ Instance created successfully!"
echo "🌐 External IP: $EXTERNAL_IP"
echo "🔗 Your backend will be available at: http://$EXTERNAL_IP:8000"
echo ""
echo "📝 To check the deployment status:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "📝 To view logs:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo journalctl -u investiq-backend -f'"
