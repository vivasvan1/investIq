#!/bin/bash

# Deploy InvestIQ Backend files to Compute Engine and restart service
# This script copies all required files and restarts the backend service

set -e

# Configuration
PROJECT_ID="speedy-445810"
INSTANCE_NAME="investiq-backend"
ZONE="asia-south1-a"

echo "🚀 Deploying InvestIQ Backend files to Compute Engine..."

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

# Create the setup script
cat > "$TEMP_DIR/setup-compute-engine.sh" << 'EOF'
#!/bin/bash

# Setup script for Compute Engine instance
# This script sets up the full InvestIQ backend with Ollama

set -e

export GEMINI_API_KEY="AIzaSyDKykjkSPXZRcT0N_e6i3JL5q3ijlOt06s"

echo "🚀 Setting up InvestIQ Backend on Compute Engine..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3.10 and pip
echo "🐍 Installing Python 3.10..."
sudo apt-get install -y python3.10 python3.10-venv python3-pip curl wget git

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

sudo chmod +x /usr/local/bin/ollama && sudo systemctl start ollama && sleep 5

# Pull Ollama models
echo "📥 Pulling Ollama models..."
ollama pull embeddinggemma

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/investiq
cd /opt/investiq

# Copy files to the correct location
echo "📋 Copying application files..."
sudo cp ~/main.py /opt/investiq/
sudo cp ~/agent_try.py /opt/investiq/
sudo cp ~/gemini_models.py /opt/investiq/
sudo cp ~/pdf_extract.py /opt/investiq/
sudo cp ~/requirements.txt /opt/investiq/
sudo cp ~/start.py /opt/investiq/

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
sudo python3.10 -m venv venv
sudo chown -R $USER:$USER /opt/investiq
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/investiq-backend.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=InvestIQ Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/investiq
Environment=PATH=/opt/investiq/venv/bin
Environment=GEMINI_API_KEY=AIzaSyDKykjkSPXZRcT0N_e6i3JL5q3ijlOt06s
ExecStart=/opt/investiq/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable and start the service
echo "🚀 Starting InvestIQ Backend service..."
sudo systemctl daemon-reload
sudo systemctl enable investiq-backend
sudo systemctl start investiq-backend

# Check service status
echo "📊 Checking service status..."
sudo systemctl status investiq-backend --no-pager

echo "✅ InvestIQ Backend setup completed!"
echo "🌐 Your backend should be available at: http://$(curl -s ifconfig.me):8000"
echo "🔍 To check logs: sudo journalctl -u investiq-backend -f"
EOF

# Make setup script executable
chmod +x "$TEMP_DIR/setup-compute-engine.sh"

# SCP all files to the instance
echo "📤 Uploading files to instance..."
gcloud compute scp --recurse "$TEMP_DIR"/* $INSTANCE_NAME:~/ --zone=$ZONE

# SSH into the instance and run the setup
echo "🔧 Running setup on instance..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    chmod +x ~/setup-compute-engine.sh
    ~/setup-compute-engine.sh
"

# Clean up temporary directory
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Deployment completed successfully!"
echo "🌐 Your backend should be available at: http://$EXTERNAL_IP:8000"
echo ""
echo "📝 To check the service status:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo systemctl status investiq-backend'"
echo ""
echo "📝 To view logs:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo journalctl -u investiq-backend -f'"
echo ""
echo "📝 To restart the service:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo systemctl restart investiq-backend'"
