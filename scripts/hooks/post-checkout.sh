#!/bin/bash
# Post-checkout Hook - Agentic SDLC Framework
# Display RBAC reminder after branch checkout
# Purpose: Remind user of their role and access restrictions after checkout

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Skip if not a branch checkout (file checkout has $3 = 0)
# $1 = previous HEAD, $2 = new HEAD, $3 = 1 if branch checkout
if [ "$3" = "0" ]; then
    exit 0
fi

# Skip if rbac-factbook.yaml doesn't exist
if [ ! -f "rbac-factbook.yaml" ]; then
    exit 0
fi

# Extract git user email
USER_EMAIL=$(git config user.email 2>/dev/null | tr '[:upper:]' '[:lower:]')

if [ -z "$USER_EMAIL" ]; then
    exit 0
fi

# Extract user role from rbac-factbook.yaml
USER_ROLE=""

# Email→role mappings live under metadata.annotations.framework_roles
if command -v yq &> /dev/null; then
    USER_ROLE=$(yq eval '.metadata.annotations.framework_roles' rbac-factbook.yaml 2>/dev/null | \
        grep -i "^[[:space:]]*$USER_EMAIL:" | \
        head -1 | \
        sed 's/.*:[[:space:]]*//' | \
        tr -d '[:space:]' | \
        tr '[:upper:]' '[:lower:]' || echo "")
else
    if grep -q "framework_roles:" rbac-factbook.yaml; then
        USER_ROLE=$(grep -A 50 "framework_roles:" rbac-factbook.yaml | \
            grep -i "^[[:space:]]*$USER_EMAIL:" | \
            head -1 | \
            sed 's/.*:[[:space:]]*//' | \
            tr -d '[:space:]' | \
            tr '[:upper:]' '[:lower:]' || echo "")
    fi
fi

# If no role found, skip
if [ -z "$USER_ROLE" ]; then
    exit 0
fi

# Display role reminder
echo -e "${BLUE}[RBAC] Welcome back, $USER_EMAIL (Role: $USER_ROLE)${NC}"

# Display role-specific access summary
case "$USER_ROLE" in
    architect)
        echo -e "${GREEN}Full framework access${NC}"
        ;;
    dev_lead)
        echo -e "${YELLOW}Access: src/, tests/, docs/ (ADRs restricted)${NC}"
        ;;
    dev_engineer)
        echo -e "${YELLOW}Access: src/, tests/ only${NC}"
        ;;
    test_engineer)
        echo -e "${YELLOW}Access: test files only${NC}"
        ;;
    *)
        echo -e "${YELLOW}Access: Standard${NC}"
        ;;
esac

exit 0
