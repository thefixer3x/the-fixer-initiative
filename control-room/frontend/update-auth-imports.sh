#!/bin/bash

# Update all imports from AuthContext to StackAuthContext
find /Users/seyederick/DevOps/_project_folders/the-fixer-initiative/control-room/frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/contexts/AuthContext|@/contexts/StackAuthContext|g'

echo "Updated all AuthContext imports to StackAuthContext"