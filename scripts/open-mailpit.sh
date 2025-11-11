#!/bin/bash

# Open Mailpit Email Testing Interface
# This script checks if Mailpit is running and opens it in your browser

set -e

echo "🔍 Checking Mailpit status..."

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi

# Check if Supabase is running
if ! docker ps | grep -q "supabase_inbucket"; then
    echo "⚠️  Mailpit is not running"
    echo "   Starting Supabase local development..."
    npx supabase start
    echo ""
fi

# Check Mailpit health
MAILPIT_URL="http://localhost:54324"
if curl -sf "${MAILPIT_URL}" > /dev/null; then
    echo "✅ Mailpit is running at ${MAILPIT_URL}"
    
    # Get email count
    EMAIL_COUNT=$(curl -s "${MAILPIT_URL}/api/v1/messages" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' || echo "0")
    echo "📧 Captured emails: ${EMAIL_COUNT}"
    echo ""
    
    # Open in default browser
    echo "🌐 Opening Mailpit in your browser..."
    
    # Detect OS and open browser accordingly
    case "$(uname -s)" in
        Darwin*)
            open "${MAILPIT_URL}"
            ;;
        Linux*)
            if command -v xdg-open > /dev/null; then
                xdg-open "${MAILPIT_URL}"
            elif command -v gnome-open > /dev/null; then
                gnome-open "${MAILPIT_URL}"
            else
                echo "   Please open ${MAILPIT_URL} manually"
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*)
            start "${MAILPIT_URL}"
            ;;
        *)
            echo "   Please open ${MAILPIT_URL} manually"
            ;;
    esac
    
    echo ""
    echo "💡 Tips:"
    echo "   • All emails are captured automatically"
    echo "   • Click 'Clear all' to delete test emails"
    echo "   • Emails persist until Supabase restart"
    echo ""
    echo "📚 Documentation: docs/MAILPIT.md"
else
    echo "❌ Error: Cannot connect to Mailpit"
    echo "   URL: ${MAILPIT_URL}"
    echo "   Try: npx supabase restart"
    exit 1
fi

