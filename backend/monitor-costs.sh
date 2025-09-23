#!/bin/bash

# Cost monitoring script for InvestIQ Backend GCP resources
# This script helps you monitor your GCP spending

set -e

# Configuration
PROJECT_ID="speedy-445810"

echo "💰 InvestIQ Backend - GCP Cost Monitoring"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo "📊 Current Resource Usage:"
echo ""

# Compute Engine costs
echo "🖥️  Compute Engine Instances:"
gcloud compute instances list --format="table(name,zone,machineType,status,creationTimestamp)" 2>/dev/null || echo "No instances found"

echo ""
echo "💾 Disks:"
gcloud compute disks list --format="table(name,zone,sizeGb,type,status)" 2>/dev/null || echo "No disks found"

echo ""
echo "🔥 Firewall Rules:"
gcloud compute firewall-rules list --format="table(name,direction,priority,sourceRanges.list():label=SRC_RANGES)" 2>/dev/null || echo "No firewall rules found"

echo ""
echo "🌐 App Engine Services:"
gcloud app services list 2>/dev/null || echo "No App Engine services found"

echo ""
echo "📈 Estimated Monthly Costs:"
echo "=========================="

# Calculate estimated costs
INSTANCE_COUNT=$(gcloud compute instances list --format="value(name)" 2>/dev/null | wc -l)
if [ "$INSTANCE_COUNT" -gt 0 ]; then
    echo "🖥️  Compute Engine (e2-micro): ~$5-10/month per instance"
    echo "   Current instances: $INSTANCE_COUNT"
    echo "   Estimated cost: $((INSTANCE_COUNT * 5))-$((INSTANCE_COUNT * 10))/month"
else
    echo "🖥️  Compute Engine: $0/month (no instances running)"
fi

echo ""
echo "🌐 App Engine: Pay-per-request (typically $0-5/month for low traffic)"

echo ""
echo "💡 Cost Optimization Tips:"
echo "=========================="
echo "1. Stop Compute Engine instances when not in use:"
echo "   gcloud compute instances stop INSTANCE_NAME --zone=ZONE"
echo ""
echo "2. Delete unused resources:"
echo "   ./cleanup-gcp-resources.sh"
echo ""
echo "3. Monitor billing in GCP Console:"
echo "   https://console.cloud.google.com/billing"
echo ""
echo "4. Set up billing alerts:"
echo "   https://console.cloud.google.com/billing/budgets"

echo ""
echo "🔍 Detailed Billing Information:"
echo "==============================="
echo "For detailed billing information, visit:"
echo "https://console.cloud.google.com/billing/projects/$PROJECT_ID"

echo ""
echo "📱 Quick Commands:"
echo "=================="
echo "• View all resources: gcloud compute instances list"
echo "• Stop all instances: gcloud compute instances stop \$(gcloud compute instances list --format='value(name)')"
echo "• Clean up everything: ./cleanup-gcp-resources.sh"
