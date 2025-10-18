#!/bin/bash
set -e

echo "Currently using PM2 to boot the system..."

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

echo "Checking PM2 config file..."
node generate-pm2-config.cjs

if pm2 list | grep -q "myf-tradeflow-backend"; then
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
echo "  Log:     pm2 logs myf-tradeflow-backend"
echo "  Restart:     pm2 restart myf-tradeflow-backend"
echo "  Stop:     pm2 stop myf-tradeflow-backend"
echo "  Delete:     pm2 delete myf-tradeflow-backend"
echo "  Monitoring Panel:     pm2 monit"

echo "======================="

pm2 startup

echo "Startup Complete!"

