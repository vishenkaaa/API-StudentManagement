const express = require('express');
const { getConfig, updateConfig } = require('../config');

const router = express.Router();

// Отримати конфігурацію
router.get('/', (req, res) => {
    res.json(getConfig());
});

// Оновити конфігурацію
router.put('/', (req, res) => {
    try {
        updateConfig(req.body);
        res.json({ message: "Конфігурацію оновлено", config: getConfig() });
    } catch (error) {
        res.status(500).json({ error: "Помилка оновлення конфігурації" });
    }
});

module.exports = router;
