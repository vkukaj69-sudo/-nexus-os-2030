#!/bin/bash
# NEXUS OS API Test Script
# Run: chmod +x test-nexus-api.sh && ./test-nexus-api.sh

TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoidmlubnlrNzJAeWFob28uY29tIiwicm9sZSI6InNvdmVyZWlnbiIsImlhdCI6MTc2ODQwODQzNSwiZXhwIjoxNzY5MDEzMjM1fQ.mPE80sDA6hJSU4sNEWS8M6gwO2U8Erw2RH7IaE1Z_ZM'
API="https://api.nexus-os.ai"

echo "=========================================="
echo "   NEXUS OS API VERIFICATION TESTS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$API$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ]; then
        if echo "$body" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ PASS${NC}"
            return 0
        elif echo "$body" | grep -q '"error"'; then
            echo -e "${RED}❌ FAIL${NC} - $(echo "$body" | grep -o '"error":"[^"]*"' | head -1)"
            return 1
        else
            echo -e "${YELLOW}⚠️  UNKNOWN${NC}"
            return 2
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - HTTP $http_code"
        return 1
    fi
}

echo "--- CORE ENDPOINTS ---"
test_endpoint "Agents List" "GET" "/api/agents/list"
test_endpoint "Analytics" "GET" "/api/analytics/usage"
test_endpoint "Workflows" "GET" "/api/workflows"
test_endpoint "Notifications" "GET" "/api/notifications"
test_endpoint "API Keys" "GET" "/api/security/apikeys"
test_endpoint "Organizations" "GET" "/api/orgs"
test_endpoint "Plugins" "GET" "/api/plugins"

echo ""
echo "--- AI AGENTS ---"
test_endpoint "Scribe Generate" "POST" "/api/scribe/generate" '{"platform":"twitter","topic":"test","contentType":"post"}'
test_endpoint "Scribe Transform" "POST" "/api/scribe/transform" '{"content":"Hello world","fromPlatform":"twitter","toPlatform":"linkedin"}'
test_endpoint "Scryer Research" "POST" "/api/scryer/analyze" '{"operation":"research","query":"AI trends"}'
test_endpoint "Soul Retrieve" "GET" "/api/soul/retrieve"

echo ""
echo "--- MEMORY SYSTEM ---"
test_endpoint "Memory Store" "POST" "/api/memory/store" '{"type":"semantic","content":"test memory","category":"test"}'
test_endpoint "Memory Recall" "POST" "/api/memory/recall" '{"query":"test"}'

echo ""
echo "--- AGENT TASKS ---"
test_endpoint "Sentinel Task" "POST" "/api/agents/sentinel_01/task" '{"operation":"tee_status"}'
test_endpoint "Oracle Execute" "POST" "/api/oracle/execute" '{"task":"test task"}'

echo ""
echo "=========================================="
echo "   TEST COMPLETE"
echo "=========================================="
