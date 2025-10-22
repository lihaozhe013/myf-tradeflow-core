#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'ecosystem.config.json');
const template = path.join(__dirname, 'ecosystem.config.template.json');

if (!fs.existsSync(target)) {
  try {
    fs.copyFileSync(template, target);
    console.log('Created ecosystem.config.json from template.');
  } catch (err) {
    console.error('Failed to create ecosystem.config.json:', err.message || err);
    process.exit(1);
  }
} else {
  console.log('ecosystem.config.json already exists.');
}

