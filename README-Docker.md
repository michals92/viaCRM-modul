# EspoCRM Docker Installation

This directory contains scripts and configuration to run EspoCRM in Docker containers.

## Quick Start

1. **Run the installation script:**
   ```bash
   chmod +x install-espocrm.sh
   ./install-espocrm.sh
   ```

2. **Access EspoCRM:**
   - EspoCRM: http://localhost:8090
   - phpMyAdmin: http://localhost:8082

## Files

- `docker-compose.yml` - Docker Compose configuration
- `install-espocrm.sh` - Complete installation script
- `fix-permissions.sh` - File permissions fix script
- `.env.example` - Environment variables template

## Manual Installation

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

2. **Start containers:**
   ```bash
   docker-compose up -d
   ```

3. **Fix permissions:**
   ```bash
   chmod +x fix-permissions.sh
   ./fix-permissions.sh
   ```

## Troubleshooting

- **Permission issues:** Run `./fix-permissions.sh`
- **Check logs:** `docker-compose logs`
- **Restart:** `docker-compose restart`
- **Clean reinstall:** `docker-compose down -v && ./install-espocrm.sh`

## Default Credentials

- **Admin Username:** admin
- **Admin Password:** Check `.env` file
- **Database User:** espocrm
- **Database Password:** Check `.env` file