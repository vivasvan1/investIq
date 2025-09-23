# InvestIQ Backend - GCP Deployment Guide

This guide will help you deploy your InvestIQ backend to Google Cloud Platform using the most cost-effective methods.

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
3. **Billing Enabled**: Enable billing on your GCP project

## Option 1: Compute Engine (Recommended for Ollama)

**Best for**: Applications that need Ollama or other system-level dependencies
**Cost**: ~$5-10/month for e2-micro instance
**Pros**: Full control, can run Ollama, persistent storage
**Cons**: Always running (unless stopped), manual scaling

### Step 1: Setup

1. **Create a GCP Project**:
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable Billing**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Navigate to Billing and enable billing for your project

3. **Update the deployment script**:
   ```bash
   # Edit deploy-compute-engine.sh
   PROJECT_ID="your-actual-project-id"
   ```

### Step 2: Deploy

1. **Make scripts executable**:
   ```bash
   chmod +x deploy-compute-engine.sh
   chmod +x startup-script.sh
   ```

2. **Deploy**:
   ```bash
   ./deploy-compute-engine.sh
   ```

3. **Upload your code** (the startup script assumes code is already there):
   ```bash
   # Get the external IP from the deployment output
   gcloud compute scp --recurse . your-instance-name:~/investiq-backend --zone=us-central1-a
   
   # SSH into the instance
   gcloud compute ssh your-instance-name --zone=us-central1-a
   
   # Move code to the correct location
   sudo mv ~/investiq-backend/* /opt/investiq/
   sudo systemctl restart investiq-backend
   ```

### Step 3: Verify Deployment

- Visit `http://YOUR_EXTERNAL_IP:8000` in your browser
- Check health: `http://YOUR_EXTERNAL_IP:8000/api/health`

## Option 2: App Engine (Serverless)

**Best for**: Simple applications without system dependencies
**Cost**: Pay per request (~$0-5/month for low traffic)
**Pros**: Auto-scaling, pay-per-use, no server management
**Cons**: Cannot run Ollama, limited to Python packages

### Step 1: Setup

1. **Create a GCP Project** (same as above)

2. **Update the deployment script**:
   ```bash
   # Edit deploy-app-engine.sh
   PROJECT_ID="your-actual-project-id"
   ```

### Step 2: Deploy

1. **Make script executable**:
   ```bash
   chmod +x deploy-app-engine.sh
   ```

2. **Deploy**:
   ```bash
   ./deploy-app-engine.sh
   ```

### Step 3: Verify Deployment

- The script will output your App Engine URL
- Visit the URL to see your deployed application

## Cost Comparison

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| Compute Engine (e2-micro) | $5-10 | Ollama, full control |
| App Engine (F1) | $0-5 | Simple APIs, low traffic |

## Managing Your Deployment

### Compute Engine

```bash
# Stop the instance (saves money)
gcloud compute instances stop your-instance-name --zone=us-central1-a

# Start the instance
gcloud compute instances start your-instance-name --zone=us-central1-a

# SSH into the instance
gcloud compute ssh your-instance-name --zone=us-central1-a

# View logs
gcloud compute ssh your-instance-name --zone=us-central1-a --command='sudo journalctl -u investiq-backend -f'
```

### Cost Management

```bash
# Monitor your costs
./monitor-costs.sh

# Clean up all resources when done
./cleanup-gcp-resources.sh
```

### App Engine

```bash
# View logs
gcloud app logs tail -s default

# List versions
gcloud app versions list

# Delete old versions (saves money)
gcloud app versions delete VERSION_ID
```

## Troubleshooting

### Common Issues

1. **Port 8000 not accessible**:
   - Check firewall rules: `gcloud compute firewall-rules list`
   - Ensure the instance has the `http-server` tag

2. **Ollama not working on App Engine**:
   - App Engine doesn't support system-level installations
   - Use Compute Engine instead

3. **Memory issues**:
   - For App Engine, upgrade to F2 or F4 instance class
   - For Compute Engine, upgrade to e2-small or e2-medium

4. **CORS errors**:
   - Update the CORS origins in `main.py` to include your domain

### Getting Help

- Check logs: `gcloud app logs tail` (App Engine) or `journalctl -u investiq-backend` (Compute Engine)
- GCP Console: [console.cloud.google.com](https://console.cloud.google.com)
- GCP Documentation: [cloud.google.com/docs](https://cloud.google.com/docs)

## Security Considerations

1. **API Keys**: Store sensitive data in Google Secret Manager
2. **HTTPS**: App Engine provides HTTPS by default
3. **Firewall**: Only open necessary ports
4. **Updates**: Keep your dependencies updated

## Next Steps

1. **Custom Domain**: Set up a custom domain for your API
2. **Monitoring**: Enable Cloud Monitoring for better observability
3. **CI/CD**: Set up automated deployments from GitHub
4. **Load Balancing**: For high-traffic applications

## Support

If you encounter issues:
1. Check the logs first
2. Verify your GCP billing is enabled
3. Ensure all required APIs are enabled
4. Check the GCP Console for error messages
