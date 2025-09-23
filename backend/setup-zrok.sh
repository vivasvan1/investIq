#!/bin/bash

# Setup Zrok tunnel for InvestIQ Backend
# This script installs Zrok and creates a public tunnel

set -e

echo "🌐 Setting up Zrok tunnel for InvestIQ Backend..."

# Check if Zrok is already installed
if ! command -v zrok &> /dev/null; then
    echo "📥 Installing Zrok..."
    
    # Download and install Zrok
    curl -sL https://github.com/openziti/zrok/releases/latest/download/zrok_0.4.30_linux_amd64.tar.gz | tar -xz
    sudo mv zrok /usr/local/bin/
    sudo chmod +x /usr/local/bin/zrok
    
    echo "✅ Zrok installed successfully!"
else
    echo "✅ Zrok is already installed!"
fi

# Check if user is logged in to Zrok
if ! zrok env | grep -q "ZROK_TOKEN"; then
    echo "🔐 Please log in to Zrok first:"
    echo "   1. Go to https://zrok.io"
    echo "   2. Sign up for a free account"
    echo "   3. Get your token from the dashboard"
    echo "   4. Run: zrok login f5tIGZSIp2BA"
    echo ""
    read -p "Press Enter after you've logged in to Zrok..."
fi

zrok login f5tIGZSIp2BA

# Create a public tunnel
echo "🚇 Creating public tunnel..."
TUNNEL_NAME="investiq-$(date +%s)"  # Unique tunnel name

# Start the tunnel in the background
echo "🌐 Starting tunnel: $TUNNEL_NAME"
nohup zrok share public localhost:8000 --backend-mode > zrok.log 2>&1 &

# Wait a moment for the tunnel to establish
sleep 5

# Get the tunnel URL from the log
TUNNEL_URL=$(grep -o 'https://[^[:space:]]*' zrok.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Tunnel created successfully!"
    echo "🌐 Your InvestIQ Backend is now available at:"
    echo "   $TUNNEL_URL"
    echo ""
    echo "📋 API Endpoints:"
    echo "   Health Check: $TUNNEL_URL/api/health"
    echo "   Chat API: $TUNNEL_URL/api/chat"
    echo "   PDF Analysis: $TUNNEL_URL/api/analyze-pdf"
    echo ""
    echo "📝 To stop the tunnel:"
    echo "   pkill -f 'zrok share'"
    echo ""
    echo "📝 To view tunnel logs:"
    echo "   tail -f zrok.log"
else
    echo "❌ Failed to create tunnel. Check zrok.log for details:"
    cat zrok.log
fi
