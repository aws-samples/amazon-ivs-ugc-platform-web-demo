#!/bin/sh
if [ $UPDATE_SNAPSHOTS = "true" ] ; then
  echo "🧪 Running E2E Tests with 📸 Updated Snapshots..."
  npx playwright test --update-snapshots;
else
  echo "🧪 Running E2E Tests..."
  npx playwright test;
fi
