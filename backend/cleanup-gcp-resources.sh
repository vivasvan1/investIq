#!/bin/bash

# Cleanup script for InvestIQ Backend GCP resources
# This script removes all resources created by the deployment scripts

set -e

# Configuration (should match your deployment configuration)
PROJECT_ID="speedy-445810"
INSTANCE_NAME="investiq-backend"
ZONE="asia-south1-a"
FIREWALL_RULE="allow-http"

echo "🧹 Cleaning up InvestIQ Backend GCP resources..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Confirm deletion
echo "⚠️  WARNING: This will delete the following resources:"
echo "   - Compute Engine instance: $INSTANCE_NAME"
echo "   - Firewall rule: $FIREWALL_RULE"
echo "   - Any associated disks"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

# Delete Compute Engine instance
echo "💻 Deleting Compute Engine instance..."
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet
    echo "✅ Instance deleted successfully"
else
    echo "ℹ️  Instance $INSTANCE_NAME not found or already deleted"
fi

# Delete firewall rule
echo "🔥 Deleting firewall rule..."
if gcloud compute firewall-rules describe $FIREWALL_RULE &> /dev/null; then
    gcloud compute firewall-rules delete $FIREWALL_RULE --quiet
    echo "✅ Firewall rule deleted successfully"
else
    echo "ℹ️  Firewall rule $FIREWALL_RULE not found or already deleted"
fi

# Delete any orphaned disks
echo "💾 Checking for orphaned disks..."
DISKS=$(gcloud compute disks list --filter="name~$INSTANCE_NAME" --format="value(name)" --zones=$ZONE)
if [ -n "$DISKS" ]; then
    echo "Found orphaned disks: $DISKS"
    for disk in $DISKS; do
        echo "Deleting disk: $disk"
        gcloud compute disks delete $disk --zone=$ZONE --quiet
    done
    echo "✅ Orphaned disks deleted"
else
    echo "ℹ️  No orphaned disks found"
fi

# Clean up App Engine resources (if any)
echo "🌐 Checking for App Engine resources..."
if gcloud app services list &> /dev/null; then
    SERVICES=$(gcloud app services list --format="value(id)" --filter="id:default")
    if [ -n "$SERVICES" ]; then
        echo "Found App Engine service: $SERVICES"
        read -p "Do you want to delete App Engine service? (yes/no): " delete_app_engine
        if [ "$delete_app_engine" = "yes" ]; then
            gcloud app services delete default --quiet
            echo "✅ App Engine service deleted"
        else
            echo "ℹ️  App Engine service kept"
        fi
    else
        echo "ℹ️  No App Engine services found"
    fi
else
    echo "ℹ️  App Engine not initialized or no services found"
fi

# List remaining resources
echo "📊 Remaining resources in project:"
echo ""
echo "Compute Engine instances:"
gcloud compute instances list --format="table(name,zone,machineType,status)" 2>/dev/null || echo "No instances found"

echo ""
echo "Firewall rules:"
gcloud compute firewall-rules list --format="table(name,direction,priority,sourceRanges.list():label=SRC_RANGES,allowed[].map().firewall_rule().list():label=ALLOW)" 2>/dev/null || echo "No firewall rules found"

echo ""
echo "App Engine services:"
gcloud app services list 2>/dev/null || echo "No App Engine services found"

echo ""
echo "✅ Cleanup completed!"
echo "💰 Remember to check your billing to ensure no unexpected charges"
echo "🔍 You can view your current resources at: https://console.cloud.google.com"
