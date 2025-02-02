const express = require('express');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Додати вчителя до студента
router.post('/add', async (req, res) => {
    try {
        const { surname, name, fatherName } = req.body;

        const newTeacher = new Teacher({ surname, name, fatherName });
        await newTeacher.save();

        res.status(201).json({ message: 'Вчителя додано', teacher: newTeacher });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Видалити вчителя у студента
router.delete('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        await Subject.updateMany({ teacher: teacherId }, { $unset: { teacher: "" } });

        const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);
        if (!deletedTeacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json({ message: 'Вчителя видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновити вчителя
router.put('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { surname, name, fatherName } = req.body;

        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { surname, name, fatherName },
            { new: true }
        );

        if (!updatedTeacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json({ message: 'Вчителя оновлено', teacher: updatedTeacher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Отримати вчителя за ID
router.get('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список усіх вчителів
router.get('/', async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
