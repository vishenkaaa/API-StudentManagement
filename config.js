const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');

function getConfig() {
    const rawData = fs.readFileSync(configPath);
    return JSON.parse(rawData);
}

function updateConfig(newConfig) {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4));
}

module.exports = { getConfig, updateConfig };
