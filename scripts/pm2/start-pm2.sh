#!/bin/bash
set -e

echo "Currently using PM2 to boot the system..."

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

echo "Checking PM2 config file..."
node generate-pm2-config.cjs

if pm2 list | grep -q "tradeflow-core-pm2"; then
    echo "Stopping the current PM2 process..."
    pm2 stop ecosystem.config.json
    pm2 delete ecosystem.config.json
fi

echo "Starting the server..."
pm2 start ecosystem.config.json

pm2 save

echo "Setting up PM2 Boot-Up Auto-Start..."

echo "======================="

echo "PM2 Process Status"

pm2 list

echo "======================="

echo " Common PM2 Commands: "
echo "  Process Status: pm2 list"
echo "  Log:     pm2 logs tradeflow-core-pm2"
echo "  Restart:     pm2 restart tradeflow-core-pm2"
echo "  Stop:     pm2 stop tradeflow-core-pm2"
echo "  Delete:     pm2 delete tradeflow-core-pm2"
echo "  Monitoring Panel:     pm2 monit"

echo "======================="

pm2 startup

echo "Startup Complete!"

