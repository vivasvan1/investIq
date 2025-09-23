# Simple Domain Setup for Compute Engine

## Option 1: Direct A Record (Simplest)

1. **Get your Compute Engine IP:**
   ```bash
   gcloud compute instances describe investiq-backend --zone=asia-south1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
   ```

2. **Create a Static IP (Recommended):**
   ```bash
   gcloud compute addresses create investiq-static-ip --global
   gcloud compute addresses describe investiq-static-ip --global --format='get(address)'
   ```

3. **Assign static IP to your instance:**
   ```bash
   gcloud compute instances add-access-config investiq-backend \
       --zone=asia-south1-a \
       --access-config-name="External NAT" \
       --address=YOUR_STATIC_IP
   ```

4. **Update your DNS:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add an A record: `api.yourdomain.com` → `YOUR_STATIC_IP`
   - Wait for DNS propagation (5-60 minutes)

## Option 2: Using Cloud DNS (More Professional)

1. **Create a DNS zone:**
   ```bash
   gcloud dns managed-zones create investiq-zone \
       --dns-name="yourdomain.com." \
       --description="InvestIQ DNS Zone"
   ```

2. **Add A record:**
   ```bash
   gcloud dns record-sets create api.yourdomain.com. \
       --zone=investiq-zone \
       --type=A \
       --ttl=300 \
       --rrdatas=YOUR_STATIC_IP
   ```

3. **Update your domain's nameservers:**
   - Get nameservers: `gcloud dns managed-zones describe investiq-zone`
   - Update at your domain registrar

## SSL Certificate Options

### Option A: Let's Encrypt (Free)
```bash
# SSH into your instance
gcloud compute ssh investiq-backend --zone=asia-south1-a

# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com
```

### Option B: Google Cloud SSL Certificate
```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create investiq-ssl \
    --domains=api.yourdomain.com

# Use with load balancer (see setup-custom-domain.sh)
```

## Testing Your Setup

1. **Check DNS propagation:**
   ```bash
   nslookup api.yourdomain.com
   ```

2. **Test HTTPS:**
   ```bash
   curl -I https://api.yourdomain.com/api/health
   ```

3. **Check SSL certificate:**
   ```bash
   openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
   ```

## Cost Considerations

- **Static IP**: ~$0.01/hour when not in use
- **Load Balancer**: ~$18/month + traffic costs
- **Cloud DNS**: ~$0.20/zone/month + queries
- **SSL Certificate**: Free with Let's Encrypt, or included with load balancer

## Recommended Approach

For **development/testing**: Use Option 1 (Direct A Record) with Let's Encrypt
For **production**: Use the load balancer setup with managed SSL certificates
