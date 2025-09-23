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
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi

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
sudo tee /etc/systemd/system/investiq-backend.service > /dev/null << 'EOF'
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
EOF

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