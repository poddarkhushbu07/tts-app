#!/bin/bash

# Create a temporary directory
TEMP_DIR=$(mktemp -d)

# Copy all necessary files
cp -r server.js package.json package-lock.json public/ .env* render.yaml $TEMP_DIR/

# Create a zip file
cd $TEMP_DIR
zip -r ../deploy.zip .

# Clean up
cd ..
rm -rf $TEMP_DIR

echo "Deployment package created as deploy.zip"
echo "Please upload this zip file to Render.com" 