#!/bin/sh
image_tag=ugc/playwright-e2e

# Get the image id of the current latest image that will be left dangling after building the new image
dangling_image_id=$(docker image ls "$image_tag:latest" -q)

echo "🔨 Building Docker Image..." 
latest_image_id=$(docker build -t ugc/playwright-e2e --no-cache -q .)

if [[ ! -z "$latest_image_id" ]] && [[ ! -z "$dangling_image_id" ]] ; then
  # Remove dangling images
  echo "🗑️  Removing Dangling Docker Images..." 
  docker image rmi -f "$dangling_image_id"
fi

# Check if the --update-snapshots flag was passed
if [[ $* == --update-snapshots ]] ; then
  update_snapshots=true
else
  update_snapshots=false
fi

echo "🚀 Running Docker Container..."
docker run --rm --ipc=host --network host -it -v $(pwd):/e2e -w /e2e --env UPDATE_SNAPSHOTS=$update_snapshots ugc/playwright-e2e /bin/bash
