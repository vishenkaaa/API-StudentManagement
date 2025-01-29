const express = require('express');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Додати вчителя до студента
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { surname, name } = req.body;
        const studentId = req.userId; 

        const newTeacher = new Teacher({ surname, name });
        await newTeacher.save();

        const student = await Student.findById(studentId);
        if (student) {
            student.teachers.push(newTeacher._id);
            await student.save();
        }

        res.status(201).json({ message: 'Вчителя додано', teacher: newTeacher });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Видалити вчителя у студента
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const studentId = req.userId; 

        const student = await Student.findById(studentId);
        if (!student || !student.teachers.includes(teacherId)) {
            return res.status(403).json({ error: 'Немає доступу до цього вчителя' });
        }

        const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);
        if (!deletedTeacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        student.teachers = student.teachers.filter((id) => id.toString() !== teacherId);
        await student.save();

        res.json({ message: 'Вчителя видалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновити вчителя
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { surname, name } = req.body;
        const studentId = req.userId;

        const student = await Student.findById(studentId);
        if (!student || !student.teachers.includes(teacherId)) {
            return res.status(403).json({ error: 'Немає доступу до цього вчителя' });
        }

        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { surname, name },
            { new: true }
        );

        if (!updatedTeacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json({ message: 'Вчителя оновлено', teacher: updatedTeacher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Отримати вчителя за ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const teacherId = req.params.id;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати список вчителів студента
router.get('/', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;

        const student = await Student.findById(studentId).populate('teachers');
        if (!student) return res.status(404).json({ error: 'Cтудента не знайдено' });

        res.json(student.teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
