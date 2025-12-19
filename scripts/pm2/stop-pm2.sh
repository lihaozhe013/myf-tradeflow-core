#!/bin/bash

echo "Stopping the server..."

if pm2 list | grep -q "tradeflow-core-pm2"; then
    pm2 stop tradeflow-core-pm2
    echo "Process Stopped"
    pm2 delete tradeflow-core-pm2
    echo "Process Deleted"
    
    echo "Current Status:"
    pm2 list
else
    echo "Error: No running tradeflow-core-pm2 process found!"
fi
