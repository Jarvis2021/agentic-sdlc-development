#!/bin/bash
# Pre-commit Hook - Agentic SDLC Framework
# RBAC enforcement for role-based file access control
# Per RBAC protocol and rbac-factbook.yaml configuration

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Agentic SDLC Framework Pre-commit Hook ===${NC}"

# Step 1: Extract git user email (case-insensitive)
USER_EMAIL=$(git config user.email | tr '[:upper:]' '[:lower:]')

if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}ERROR: No git email configured${NC}"
    echo "Run: git config user.email 'your.email@company.com'"
    exit 1
fi

echo "User email: $USER_EMAIL"

# Step 2: Check if rbac-factbook.yaml exists
if [ ! -f "rbac-factbook.yaml" ]; then
    echo -e "${YELLOW}WARNING: rbac-factbook.yaml not found, skipping RBAC validation${NC}"
    exit 0
fi

# Step 3: Extract user role from rbac-factbook.yaml
USER_ROLE=""

# Try yq first for proper YAML parsing, fall back to grep
# Email→role mappings live under metadata.annotations.framework_roles
if command -v yq &> /dev/null; then
    USER_ROLE=$(yq eval '.metadata.annotations.framework_roles' rbac-factbook.yaml 2>/dev/null | \
        grep -i "^[[:space:]]*$USER_EMAIL:" | \
        head -1 | \
        sed 's/.*:[[:space:]]*//' | \
        tr -d '[:space:]' || echo "")
else
    # Fallback: grep-based extraction from framework_roles block
    if grep -q "framework_roles:" rbac-factbook.yaml; then
        USER_ROLE=$(grep -A 50 "framework_roles:" rbac-factbook.yaml | \
            grep -i "^[[:space:]]*$USER_EMAIL:" | \
            head -1 | \
            sed 's/.*:[[:space:]]*//' | \
            tr -d '[:space:]' || echo "")
    fi
fi

if [ -z "$USER_ROLE" ]; then
    echo -e "${RED}ERROR: Email '$USER_EMAIL' not found in rbac-factbook.yaml${NC}"
    echo ""
    echo "To resolve:"
    echo "1. Ask your architect to add your email to rbac-factbook.yaml under metadata.annotations.framework_roles:"
    echo "   $USER_EMAIL: <your_role>"
    echo ""
    echo "2. Or use 'git commit --no-verify' to bypass (emergency only)"
    exit 1
fi

echo -e "${GREEN}Role detected: $USER_ROLE${NC}"

# Step 4: Architect-only framework protection
if [ "$USER_ROLE" != "architect" ]; then
    PROTECTED_CHANGES=$(git diff --cached --name-only | grep -E '^(AGENTS\.md|\.ai/protocols/|rbac-factbook\.yaml|\.ai/domain-governance\.yaml|\.ai/project-config\.yaml)' || true)
    if [ -n "$PROTECTED_CHANGES" ]; then
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}ERROR: Only architects can modify framework core${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo "Protected paths (AGENTS.md, .ai/protocols/, rbac-factbook.yaml, etc.) require architect role."
        echo ""
        echo "Blocked files:"
        echo "$PROTECTED_CHANGES" | while read -r file; do
            echo "  - $file"
        done
        echo ""
        echo "Your role: $USER_ROLE"
        echo ""
        echo "To resolve:"
        echo "1. Ask an architect to make these changes"
        echo "2. Use 'git commit --no-verify' to bypass (EMERGENCY ONLY)"
        exit 1
    fi
fi

# Step 5: Validate file access based on role
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -n "$STAGED_FILES" ]; then
    echo "Validating access for staged files..."
    VALIDATION_FAILED=0

    for FILE in $STAGED_FILES; do
        case "$USER_ROLE" in
            architect)
                # Architects have full access
                ;;
            dev_lead)
                # Dev leads can modify src/, cannot modify .ai/decisions/ (ADRs)
                if echo "$FILE" | grep -qE '^\.ai/decisions/'; then
                    echo -e "${RED}ACCESS DENIED: Dev Lead role cannot modify ADRs: $FILE${NC}"
                    VALIDATION_FAILED=1
                fi
                ;;
            dev_engineer)
                # Dev engineers can modify src/, tests/, cannot modify .ai/ or docs/
                if echo "$FILE" | grep -qE '^(\.ai/|docs/)'; then
                    echo -e "${RED}ACCESS DENIED: Dev Engineer role cannot modify: $FILE${NC}"
                    VALIDATION_FAILED=1
                fi
                ;;
            test_engineer)
                # Test engineers can modify test files only
                if echo "$FILE" | grep -qE '^src/' && ! echo "$FILE" | grep -qE '\.(test|spec)\.(ts|js|py)$'; then
                    echo -e "${RED}ACCESS DENIED: Test Engineer role cannot modify production code: $FILE${NC}"
                    VALIDATION_FAILED=1
                fi
                if echo "$FILE" | grep -qE '^\.ai/'; then
                    echo -e "${RED}ACCESS DENIED: Test Engineer role cannot modify framework files: $FILE${NC}"
                    VALIDATION_FAILED=1
                fi
                ;;
            *)
                echo -e "${YELLOW}WARNING: Unknown role '$USER_ROLE', allowing commit${NC}"
                ;;
        esac
    done

    if [ "$VALIDATION_FAILED" -eq 1 ]; then
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}Commit BLOCKED due to role-based access control${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo "Your role: $USER_ROLE"
        echo "Your email: $USER_EMAIL"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✓ All file access validations passed${NC}"
fi

echo ""
echo -e "${GREEN}✓ Pre-commit checks passed${NC}"
