const express = require('express');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Додати предмет
router.post('/add', async (req, res) => {
    try {
        const { studentId, name, teacherId, hoursPerWeek } = req.body;

        const newSubject = new Subject({ name, teacher: teacherId, hoursPerWeek });
        await newSubject.save();

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Студента не знайдено' });
        }

        student.subjects.push(newSubject._id);
        await student.save();

        res.status(201).json({ message: 'Предмет додано', subject: newSubject });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Видалити предмет
router.delete('/:id', async (req, res) => {
    try {
        const { subjectId, studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student || !student.subjects.includes(subjectId)) {
            return res.status(403).json({ error: 'Немає доступу до цього предмета' });
        }

        await Subject.findByIdAndDelete(subjectId);
        student.subjects = student.subjects.filter((id) => id.toString() !== subjectId);
        await student.save();

        res.json({ message: 'Предмет видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновити предмет
router.put('/:id', async (req, res) => {
    try {
        const subjectId = req.params.id;
        const { name, teacherId, hoursPerWeek } = req.body;

        const updatedSubject = await Subject.findByIdAndUpdate(
            subjectId,
            { name, teacher: teacherId, hoursPerWeek },
            { new: true }
        );

        if (!updatedSubject) return res.status(404).json({ error: 'Предмет не знайдено' });

        res.json({ message: 'Предмет оновлено', subject: updatedSubject });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати предмет за ID
router.get('/:id', async (req, res) => {
    try {
        const subjectId = req.params.id;

        const subject = await Subject.findById(subjectId).populate('teacher');
        if (!subject) return res.status(404).json({ error: 'Предмет не знайдено' });

        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список предметів авторизованого студента
router.get('/', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId; 

        const student = await Student.findById(studentId).populate('subjects');
        if (!student) return res.status(404).json({ error: 'Cтудента не знайдено' });

        res.json(student.subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список предметів студента по його ID
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId).populate('subjects');
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        res.json(student.subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
