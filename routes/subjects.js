const express = require('express');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

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
        const subjectId = req.params.id;
        const studentId = req.query.studentId;

        const student = await Student.findById(studentId);
        if (!student || !student.subjects.includes(subjectId)) {
            return res.status(403).json({ error: 'Немає доступу до цього предмета' });
        }

        const schedulesToDelete = await Schedule.find({ subject: subjectId });
        const scheduleIdsToDelete = schedulesToDelete.map(schedule => schedule._id.toString());

        await Schedule.deleteMany({ subject: subjectId });

        student.subjects = student.subjects.filter(id => id.toString() !== subjectId);

        // Видалити ID видалених записів розкладу з `student.schedule`
        student.schedule = student.schedule.filter(id => !scheduleIdsToDelete.includes(id.toString()));

        await student.save();
        await Subject.findByIdAndDelete(subjectId);

        res.json({ message: 'Предмет та відповідні записи з розкладу видалено' });
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

// Отримати список предметів вчителя за його ID (тільки ті, що вивчає авторизований студент)
router.get('/teacher/:teacherId', authMiddleware, async (req, res) => {
    try {
        const { teacherId } = req.params;
        const studentId = req.userId; 
        
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ error: 'Неправильний формат ID вчителя' });
        }
        
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ error: 'Вчителя не знайдено' });
        }
        
        const student = await Student.findById(studentId).populate('subjects');
        if (!student) {
            return res.status(404).json({ error: 'Студента не знайдено' });
        }
        
        const studentSubjectIds = student.subjects.map(subject => subject._id.toString());
        
        const teacherSubjects = await Subject.find({ 
            teacher: teacherId,
            _id: { $in: studentSubjectIds }
        });
        
        res.json(teacherSubjects);
    } catch (error) {
        console.error('Помилка отримання предметів вчителя:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;