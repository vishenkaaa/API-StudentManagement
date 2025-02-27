const express = require('express');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Отримати список вчителів авторизованого учня
router.get('/student', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;
        console.log(`Отримано studentId: ${studentId}`);

        const student = await Student.findById(studentId).populate({
            path: 'subjects',
            populate: { path: 'teacher', select: '_id surname name fatherName' } 
        });

        if (!student) {
            console.log('Студента не знайдено');
            return res.status(404).json({ error: 'Студента не знайдено' });
        }

        // Перевірка, чи є у предметах вчителі
        const teacherIds = [];
        student.subjects.forEach(subject => {
            if (subject.teacher && subject.teacher._id) {
                teacherIds.push(subject.teacher._id.toString());
            }
        });
        const uniqueTeacherIds = [...new Set(teacherIds)];

        // Фільтруємо, залишаючи тільки валідні ObjectId
        const validTeacherIds = uniqueTeacherIds.filter(id => 
            id && mongoose.Types.ObjectId.isValid(id));

        if (validTeacherIds.length === 0) {
            return res.json([]);
        }

        const teachers = await Teacher.find({ 
            _id: { $in: validTeacherIds } 
        });

        res.json(teachers);
    } catch (error) {
        console.error('Помилка сервера:', error);
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
        
        // Перевірка валідності ObjectId
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ error: 'Неправильний формат ID вчителя' });
        }

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) return res.status(404).json({ error: 'Вчителя не знайдено' });

        res.json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;