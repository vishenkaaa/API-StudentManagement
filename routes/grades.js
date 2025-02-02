const express = require('express');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Додати оцінку
router.post('/add', async (req, res) => {
    try {
        const { studentId, subjectId, grade, date } = req.body;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        const newGrade = new Grade({
            student: studentId, 
            subject: subjectId,
            grade,
            date: date || new Date()
        });

        await newGrade.save(); 

        student.grades.push(newGrade._id);
        await student.save();

        res.status(201).json({ message: 'Оцінку додано', grade: newGrade });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Видалити оцінку
router.delete('/:id', async (req, res) => {
    try {
        const gradeId = req.params.id;
        const studentId = req.query.studentId; 

        const student = await Student.findById(studentId);
        if (!student || !student.grades.includes(gradeId)) {
            return res.status(403).json({ error: 'Немає доступу до цієї оцінки' });
        }

        await Grade.findByIdAndDelete(gradeId);
        student.grades = student.grades.filter((id) => id.toString() !== gradeId);
        await student.save();

        res.json({ message: 'Оцінку видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновити оцінку
router.put('/:id', async (req, res) => {
    try {
        const gradeId = req.params.id;
        const { grade, date } = req.body;

        const updatedGrade = await Grade.findByIdAndUpdate(
            gradeId,
            { grade, date },
            { new: true }
        );

        if (!updatedGrade) return res.status(404).json({ error: 'Оцінку не знайдено' });

        res.json({ message: 'Оцінку оновлено', grade: updatedGrade });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати оцінку за ID
router.get('/:id', async (req, res) => {
    try {
        const gradeId = req.params.id;

        const grade = await Grade.findById(gradeId).populate('grades');
        if (!grade) return res.status(404).json({ error: 'Оцінку не знайдено' });

        res.json(grade);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список оцінок авторизованого студента
router.get('/', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;

        const student = await Student.findById(studentId).populate('grades');
        if (!student) return res.status(404).json({ error: 'Cтудента не знайдено' });

        res.json(student.grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список оцінок студента за його id
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId).populate('grades');
        if (!student) return res.status(404).json({ error: 'Cтудента не знайдено' });

        res.json(student.grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;