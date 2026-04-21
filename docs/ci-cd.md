# CI/CD Deployment Guide

This project now includes a production pipeline based on:

- `GitHub Actions` for CI and CD
- `Docker` for consistent builds
- `GHCR` (GitHub Container Registry) for storing images
- `Docker Compose` on a VPS for running production containers
- `Nginx` as the reverse proxy

This setup is a strong fit for the current stack because:

- the frontend is a Vite static app
- the backend is an Express API with runtime secrets
- the backend serves uploads and may use websockets
- MongoDB is already externalized through `MONGO_URI`

## 1. What Happens After Setup

1. You push code to `main`.
2. GitHub Actions runs the `CI` workflow.
3. If the frontend and backend both build successfully, the `Deploy Production` workflow starts.
4. Docker images are built and pushed to `ghcr.io`.
5. GitHub Actions connects to your VPS over SSH.
6. The server pulls the latest images and restarts the containers.
7. Your live site updates automatically.

## 2. Files Added For The Pipeline

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `deploy/nginx.conf`
- `docker-compose.prod.yml`
- `.env.production.example`

## 3. Recommended Production Architecture

- `MongoDB Atlas` for the database
- `GitHub` for source control
- `GitHub Actions` for automation
- `GHCR` for Docker images
- `Ubuntu VPS` on DigitalOcean, AWS EC2, Hetzner, Azure VM, or similar
- `Docker Compose` to run:
  - `proxy`
  - `frontend`
  - `backend`
- `Cloudflare` optional for DNS and SSL proxying

## 4. First-Time Server Setup

Use an Ubuntu VPS with a public IP and point your domain DNS to it.

Install Docker and Git:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Log out and back in once after adding your user to the Docker group.

Clone the repository:

```bash
sudo mkdir -p /opt/aptitude-test-platform
sudo chown -R $USER:$USER /opt/aptitude-test-platform
git clone https://github.com/YOUR_GITHUB_USERNAME/aptitude-test-platform.git /opt/aptitude-test-platform
cd /opt/aptitude-test-platform
```

Create your production env file:

```bash
cp .env.production.example .env.production
```

Update `.env.production` with real values:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL=https://yourdomain.com`
- `PUBLIC_SERVER_URL=https://yourdomain.com`
- optional Cloudinary keys
- `GHCR_OWNER=your-github-username`
- `IMAGE_TAG=latest`

## 5. GitHub Secrets To Add

In GitHub: `Repository -> Settings -> Secrets and variables -> Actions`

Add these repository secrets:

- `SSH_HOST`: your VPS public IP or hostname
- `SSH_USER`: your Linux username
- `SSH_PORT`: usually `22`
- `SSH_PRIVATE_KEY`: private key matching the public key added to the server
- `GHCR_USERNAME`: your GitHub username
- `GHCR_PAT`: GitHub personal access token with `read:packages`

Notes:

- `GITHUB_TOKEN` is already used by Actions to push images during the workflow.
- `GHCR_PAT` is needed on the server side so Docker can pull private images from `ghcr.io`.

## 6. SSH Key Setup

Generate a deploy key on your local machine if you do not already have one:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy"
```

Append the public key to the VPS:

```bash
mkdir -p ~/.ssh
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Then paste the private key contents into the `SSH_PRIVATE_KEY` GitHub secret.

## 7. Make The Registry Accessible

Your deploy workflow publishes images with these names:

- `ghcr.io/YOUR_GITHUB_USERNAME/aptitude-test-platform-frontend:latest`
- `ghcr.io/YOUR_GITHUB_USERNAME/aptitude-test-platform-backend:latest`

If your packages are private, ensure the `GHCR_PAT` token has package read access.

## 8. First Manual Deployment

Before relying on full automation, do one controlled deploy on the server:

```bash
echo YOUR_GHCR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
GHCR_OWNER=YOUR_GITHUB_USERNAME IMAGE_TAG=latest docker compose -f docker-compose.prod.yml pull
GHCR_OWNER=YOUR_GITHUB_USERNAME IMAGE_TAG=latest docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
curl http://localhost/health
```

If that works, your containers and proxy are wired correctly.

## 9. SSL For Production

For a real public launch, add HTTPS before going live.

You have two good options:

- Put the VPS behind Cloudflare and enable SSL there.
- Install Certbot on the VPS and add TLS certificates to Nginx.

If you want the cleanest next step, use Cloudflare for DNS plus SSL, then later move to end-to-end origin certificates if needed.

## 10. How Automatic Deployment Works

### CI workflow

The `CI` workflow runs on pushes and pull requests to `main` and does this:

- installs frontend dependencies
- builds the frontend with `VITE_API_BASE_URL=/api`
- installs backend dependencies
- builds the backend

If any build fails, deployment stops.

### Deploy workflow

The `Deploy Production` workflow runs only when:

- the `CI` workflow succeeded
- the branch is `main`

It then:

- builds Docker images for frontend and backend
- pushes those images to `GHCR`
- connects to your VPS over SSH
- updates the server to the latest `main`
- pulls the latest images
- restarts the stack with Docker Compose

## 11. Deployment Process In Plain English

1. Edit code locally.
2. Commit your changes.
3. Push to GitHub `main`.
4. GitHub validates the build.
5. GitHub publishes fresh images.
6. GitHub tells your server to pull and restart.
7. Users see the new version automatically.

## 12. Best Practices For Production

- Protect the `main` branch and require pull requests.
- Add a real test suite and run it in `ci.yml`.
- Keep secrets only in GitHub Actions secrets and server env files.
- Never commit `.env.production`.
- Use MongoDB Atlas IP allowlists carefully.
- Keep uploads on a persistent volume or move fully to Cloudinary/S3.
- Add uptime monitoring for `/health`.
- Add error logging such as Sentry for frontend and backend.
- Pin a Node.js major version across local, CI, and Docker.
- Use a staging environment before deploying to production.

## 13. Suggested Next Improvements

After the basic pipeline is working, the next upgrades I would recommend are:

- add backend tests
- add frontend tests
- add health checks in Compose
- add staging deployment on a `develop` branch
- add rollback by deploying immutable image tags instead of only `latest`
- add HTTPS termination with Cloudflare or Certbot

## 14. Important Note About This Repo

This pipeline assumes:

- your production branch is `main`
- your server path is `/opt/aptitude-test-platform`
- your frontend and backend images will live under your GitHub account namespace in `GHCR`
- your frontend should call the backend through the same domain using `/api`

If you want, the next step can be tightening this further for your exact hosting provider, such as AWS, DigitalOcean, Render, Railway, or Vercel.
