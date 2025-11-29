const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.json');

const readConfig = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        const rawData = fs.readFileSync(CONFIG_PATH);
        return JSON.parse(rawData);
    }
    return {};
};

const writeConfig = (data) => {
    const currentConfig = readConfig();
    const newConfig = { ...currentConfig, ...data };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = { readConfig, writeConfig };
