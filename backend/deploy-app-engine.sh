# #!/bin/bash

# # Deploy InvestIQ Backend to Google App Engine
# # This script deploys the application to App Engine

# set -e

# # Configuration
# PROJECT_ID="speedy-445810"  # Replace with your GCP project ID
# REGION="asia-south1"

# echo "🚀 Deploying InvestIQ Backend to App Engine..."

# # Check if gcloud is installed
# if ! command -v gcloud &> /dev/null; then
#     echo "❌ gcloud CLI is not installed. Please install it first:"
#     echo "   https://cloud.google.com/sdk/docs/install"
#     exit 1
# fi

# # Set project
# echo "📋 Setting project to $PROJECT_ID..."
# gcloud config set project $PROJECT_ID

# # Enable required APIs
# echo "🔧 Enabling required APIs..."
# gcloud services enable appengine.googleapis.com
# gcloud services enable cloudbuild.googleapis.com

# # Initialize App Engine (if not already initialized)
# echo "🏗️  Initializing App Engine..."
# gcloud app create --region=$REGION || echo "App Engine may already be initialized"

# # Deploy the application
# echo "📦 Deploying application..."
# gcloud app deploy app.yaml --quiet

# # Get the service URL
# SERVICE_URL=$(gcloud app browse --no-launch-browser)

# echo "✅ Deployment completed successfully!"
# echo "🌐 Your backend is available at: $SERVICE_URL"
# echo ""
# echo "📝 To view logs:"
# echo "   gcloud app logs tail -s default"
# echo ""
# echo "📝 To manage the service:"
# echo "   gcloud app services list"
# echo "   gcloud app versions list"
