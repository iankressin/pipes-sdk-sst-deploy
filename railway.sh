#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initial checks
check_git_repo() {
  if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Git repo initialized"
    return 0
  else
    echo -e "${RED}✗${NC} Not a git repo"
    return 1
  fi
}

check_git_remote() {
  if git remote get-url origin > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} GitHub remote configured: $(git remote get-url origin)"
    return 0
  else
    echo -e "${RED}✗${NC} No GitHub remote configured"
    return 1
  fi
}

check_railway_login() {
  if railway whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Railway user logged in: $(railway whoami)"
    return 0
  else
    echo -e "${RED}✗${NC} Not logged in to Railway. Run 'railway login' first"
    return 1
  fi
}

run_initial_checks() {
  echo "Running initial checks..."
  check_git_repo || exit 1
  check_git_remote || exit 1
  check_railway_login || exit 1
  echo ""
}

# Retrieve values
get_package_name() {
  if [ -f package.json ]; then
    PACKAGE_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
    if [ -n "$PACKAGE_NAME" ]; then
      echo -e "${GREEN}✓${NC} Package name: $PACKAGE_NAME" >&2
      echo "$PACKAGE_NAME"
    else
      echo -e "${RED}✗${NC} Could not extract package name from package.json" >&2
      return 1
    fi
  else
    echo -e "${RED}✗${NC} package.json not found" >&2
    return 1
  fi
}

get_github_repo() {
  REMOTE_URL=$(git remote get-url origin 2>/dev/null)
  if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}✗${NC} No remote URL found" >&2
    return 1
  fi
  
  # Extract user/repo from various git remote formats
  # git@github.com:user/repo.git -> user/repo
  # https://github.com/user/repo.git -> user/repo
  # https://github.com/user/repo -> user/repo
  # Using a more compatible sed pattern for BSD sed (macOS)
  GITHUB_REPO=$(echo "$REMOTE_URL" | sed -E 's|^.*github\.com[:/]([^/]+/[^/]+)(\.git)?$|\1|' | sed 's|\.git$||')
  
  if [ -n "$GITHUB_REPO" ]; then
    echo -e "${GREEN}✓${NC} GitHub repo: $GITHUB_REPO" >&2
    echo "$GITHUB_REPO"
  else
    echo -e "${RED}✗${NC} Could not extract GitHub repo from remote URL: $REMOTE_URL" >&2
    return 1
  fi
}

check_drizzle_config() {
  if [ -f drizzle.config.ts ]; then
    echo -e "${GREEN}✓${NC} drizzle.config.ts found - assuming Postgres database" >&2
    echo "postgres"
  else
    echo -e "${YELLOW}⚠${NC} drizzle.config.ts not found - defaulting to postgres" >&2
    echo "postgres"
  fi
}

retrieve_values() {
  echo "Retrieving values..."
  PACKAGE_NAME=$(get_package_name)
  GITHUB_REPO=$(get_github_repo)
  DATABASE_TYPE=$(check_drizzle_config)
  echo ""
  
  # Export for use in deploy function
  export PACKAGE_NAME
  export GITHUB_REPO
  export DATABASE_TYPE
}

# Deploy project
deploy_to_railway() {
  echo "Deploying to Railway..."
  echo "  Project name: $PACKAGE_NAME"
  echo "  GitHub repo: $GITHUB_REPO"
  echo "  Database: $DATABASE_TYPE"
  echo ""
  
  # Initialize Railway project
  echo "Initializing Railway project..."
  railway init --name "$PACKAGE_NAME" || {
    echo -e "${YELLOW}⚠${NC} Railway project may already exist, continuing..."
  }
  echo ""
  
  # Add database
  echo "Adding database..."
  railway add -d "$DATABASE_TYPE" || {
    echo -e "${YELLOW}⚠${NC} Database may already exist, continuing..."
  }
  echo ""
  
  # Add indexer service
  echo "Adding indexer service..."
  railway add -s indexer -r "$GITHUB_REPO" -v "DB_CONNECTION_STR=\${{Postgres.DATABASE_URL}}" || {
    echo -e "${YELLOW}⚠${NC} Service may already exist, continuing..."
  }
  echo ""
  
  echo -e "${GREEN}✓${NC} Deployment setup complete!"

  sleep 2
  railway open
}

# Main function
main() {
  run_initial_checks
  retrieve_values
  deploy_to_railway
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
  main "$@"
fi
