#!/bin/sh
echo "🔨 Building Docker Image..." 
docker build -t ugc/playwright-e2e -q .

# Check if the --update-snapshots flag was passed
if [[ $* == --update-snapshots ]] ; then
  update_snapshots=true
else
  update_snapshots=false
fi

echo "🚀 Running Docker Container..."
docker run --rm --ipc=host --network host -it -v $(pwd):/e2e -w /e2e --env UPDATE_SNAPSHOTS=$update_snapshots ugc/playwright-e2e /bin/bash
