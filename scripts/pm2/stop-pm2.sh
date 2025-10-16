#!/bin/bash

echo "Stopping the server..."

if pm2 list | grep -q "myf-tradeflow-backend"; then
    pm2 stop myf-tradeflow-backend
    echo "Process Stopped"
    pm2 delete myf-tradeflow-backend
    echo "Process Deleted"
    
    echo "Current Status:"
    pm2 list
else
    echo "Error: No running myf-tradeflow-backend process found!"
fi
