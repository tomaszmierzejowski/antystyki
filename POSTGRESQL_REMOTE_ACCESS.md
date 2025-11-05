# 🔌 Enabling Remote PostgreSQL Access via pgAdmin

This guide shows you how to enable remote connections to your PostgreSQL database running in Docker, so you can connect from pgAdmin or other database tools.

## ⚠️ Security Warning

**Before enabling remote access, understand the risks:**
- Your database will be accessible from the internet (if firewall allows)
- You must use strong passwords
- Consider restricting access by IP address
- For production, use SSL/TLS encryption (covered in Advanced section)

## Quick Setup (Development/Testing)

### Step 1: Update Docker Compose

Edit `docker-compose.production.yml` and change the PostgreSQL port binding:

**Before:**
```yaml
ports:
  - "127.0.0.1:5432:5432"  # Only bind to localhost for security
```

**After:**
```yaml
ports:
  - "5432:5432"  # Allow external connections
```

### Step 2: Configure PostgreSQL to Accept Remote Connections

Create a PostgreSQL configuration directory and files:

```bash
mkdir -p database/postgres-config
```

Create `database/postgres-config/postgresql.conf`:
```conf
# Listen on all interfaces
listen_addresses = '*'

# Connection settings
max_connections = 100
shared_buffers = 128MB

# Logging
log_connections = on
log_disconnections = on
```

Create `database/postgres-config/pg_hba.conf`:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Allow local connections (from inside container)
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5

# Allow connections from Docker network
host    all             all             172.16.0.0/12           md5

# Allow remote connections (CHANGE THIS FOR PRODUCTION!)
# Option A: Allow from any IP (NOT RECOMMENDED FOR PRODUCTION)
host    all             all             0.0.0.0/0               md5

# Option B: Allow only from specific IP (RECOMMENDED)
# host    all             all             YOUR_IP_ADDRESS/32      md5
```

### Step 3: Update Docker Compose to Use Config Files

Add volume mounts to your PostgreSQL service in `docker-compose.production.yml`:

```yaml
postgres:
  image: postgres:16-alpine
  container_name: antystics-db
  restart: always
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=C"
  ports:
    - "5432:5432"  # Changed from 127.0.0.1:5432:5432
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./database/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh:ro
    - ./database/postgres-config/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    - ./database/postgres-config/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
    - ./backups:/backups
  command: >
    postgres
    -c config_file=/etc/postgresql/postgresql.conf
    -c hba_file=/etc/postgresql/pg_hba.conf
  # ... rest of config
```

### Step 4: Configure Firewall (Ubuntu/Debian)

```bash
# Allow PostgreSQL port (5432) from specific IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 5432

# OR allow from any IP (less secure)
sudo ufw allow 5432/tcp

# Check firewall status
sudo ufw status
```

### Step 5: Restart Docker Containers

```bash
cd /path/to/antystics
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Step 6: Verify Connection

Test from your local machine:

```bash
# Using psql (if installed)
psql -h YOUR_SERVER_IP -U postgres -d antystics

# Or test with telnet
telnet YOUR_SERVER_IP 5432
```

## Connecting with pgAdmin

1. **Open pgAdmin** and right-click "Servers" → "Register" → "Server"

2. **General Tab:**
   - Name: `Antystics Production` (or any name)

3. **Connection Tab:**
   - Host name/address: `YOUR_SERVER_IP` (or domain name)
   - Port: `5432`
   - Maintenance database: `antystics` (or your database name)
   - Username: `postgres` (or your POSTGRES_USER)
   - Password: `YOUR_POSTGRES_PASSWORD`

4. **Click "Save"** and test the connection

## Advanced: Production Security

### Option 1: IP Whitelist (Recommended)

Edit `database/postgres-config/pg_hba.conf`:

```conf
# Only allow your office IP and server IP
host    all             all             YOUR_OFFICE_IP/32        md5
host    all             all             YOUR_SERVER_IP/32         md5

# Deny everything else
host    all             all             0.0.0.0/0                 reject
```

### Option 2: SSL/TLS Encryption

1. Generate SSL certificates (on your server):

```bash
# Create directory for certificates
mkdir -p database/postgres-ssl
cd database/postgres-ssl

# Generate self-signed certificate (for testing)
openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=antystics-db"

# Set proper permissions
chmod 600 server.key
chmod 644 server.crt
```

2. Update `database/postgres-config/postgresql.conf`:

```conf
# SSL Configuration
ssl = on
ssl_cert_file = '/var/lib/postgresql/server.crt'
ssl_key_file = '/var/lib/postgresql/server.key'
```

3. Update `docker-compose.production.yml`:

```yaml
postgres:
  volumes:
    - ./database/postgres-ssl/server.crt:/var/lib/postgresql/server.crt:ro
    - ./database/postgres-ssl/server.key:/var/lib/postgresql/server.key:ro
  # ... rest of config
```

4. In pgAdmin, go to **SSL tab**:
   - SSL mode: `require`

### Option 3: SSH Tunnel (Most Secure)

Instead of exposing PostgreSQL directly, use SSH tunneling:

1. **On your local machine, create SSH tunnel:**

```bash
ssh -L 5432:localhost:5432 user@YOUR_SERVER_IP
```

2. **In pgAdmin, connect to:**
   - Host: `localhost` (not the server IP)
   - Port: `5432`

This way PostgreSQL never exposes its port to the internet.

## Troubleshooting

### "Connection refused"
- Check if PostgreSQL is running: `docker ps | grep postgres`
- Check if port is bound: `docker port antystics-db`
- Check firewall: `sudo ufw status`

### "Authentication failed"
- Verify password in `.env` file matches `POSTGRES_PASSWORD`
- Check `pg_hba.conf` allows your connection method (md5, trust, etc.)

### "Connection timeout"
- Check firewall rules: `sudo ufw status`
- Verify server allows incoming connections on port 5432
- Check if PostgreSQL is listening: `netstat -tlnp | grep 5432` (inside container)

### "Database does not exist"
- Verify database name in connection string matches your `POSTGRES_DB` environment variable
- Check logs: `docker logs antystics-db`

### Check PostgreSQL Logs

```bash
# View real-time logs
docker logs -f antystics-db

# Check last 100 lines
docker logs --tail 100 antystics-db
```

## Quick Reference

**Connection String Format:**
```
Host=YOUR_SERVER_IP;Port=5432;Database=antystics;Username=postgres;Password=YOUR_PASSWORD
```

**Test Connection from Command Line:**
```bash
psql -h YOUR_SERVER_IP -p 5432 -U postgres -d antystics
```

**Check if PostgreSQL is listening:**
```bash
docker exec antystics-db netstat -tlnp | grep 5432
```

**View PostgreSQL configuration:**
```bash
docker exec antystics-db cat /etc/postgresql/postgresql.conf
docker exec antystics-db cat /etc/postgresql/pg_hba.conf
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Restricted access in `pg_hba.conf` (IP whitelist or specific IPs)
- [ ] Configured firewall to only allow necessary IPs
- [ ] Enabled SSL/TLS for production (optional but recommended)
- [ ] Regularly updated PostgreSQL image
- [ ] Backed up database regularly
- [ ] Considered SSH tunnel for most secure access

## Next Steps

After enabling remote access:
1. Test connection from pgAdmin
2. Verify you can browse tables and run queries
3. Review security settings (especially for production)
4. Document your connection details securely

---

**Need Help?** Check the troubleshooting section or review PostgreSQL logs for specific error messages.

