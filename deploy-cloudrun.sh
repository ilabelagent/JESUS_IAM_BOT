#!/usr/bin/env bash
set -euo pipefail

# PLAIKE BOT - Google Cloud Run Deployment Script
# Usage: ./deploy-cloudrun.sh <PROJECT_ID> [REGION]
#
# Requirements:
# - gcloud CLI installed and authenticated
# - Docker installed
# - Service account with Cloud Run permissions

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SERVICE_NAME="richthepluto-bot"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

if [[ -z "${PROJECT_ID}" ]]; then
    echo "ERROR: PROJECT_ID is required"
    echo "Usage: $0 <PROJECT_ID> [REGION]"
    echo ""
    echo "Example: ./deploy-cloudrun.sh my-gcp-project us-central1"
    exit 1
fi

echo "==========================================