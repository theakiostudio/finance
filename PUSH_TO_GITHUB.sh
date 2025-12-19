#!/bin/bash
# After creating the repository on GitHub, run this script
# Replace YOUR_USERNAME with your GitHub username if different from "dreampink"

echo "Adding remote and pushing to GitHub..."
git remote add origin https://github.com/dreampink/finance.git
git branch -M main
git push -u origin main

echo "Done! Now you can deploy to Vercel."

