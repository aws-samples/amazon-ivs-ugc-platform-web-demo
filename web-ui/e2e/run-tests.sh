#!/bin/sh
echo "🔨 Building Docker Image..." 
docker build -t ugc/playwright-e2e -q .

echo "🚀 Running Docker Container..."
docker run --rm --ipc=host --network host -it -v $(pwd):/e2e -w /e2e --env ADDITIONAL_ARGS="$*" ugc/playwright-e2e /bin/bash
