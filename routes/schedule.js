const express = require('express');
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Додати заняття до розкладу студента
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { dayOfWeek, time, subject, teacher } = req.body;
        const studentId = req.userId; 

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        const newSchedule = new Schedule({ dayOfWeek, time, subject, teacher });
        await newSchedule.save();

        student.schedule.push(newSchedule._id);
        await student.save();

        res.status(201).json({ message: 'Заняття додано до розкладу студента', schedule: newSchedule });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Оновити заняття в розкладі студента
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const { dayOfWeek, time, subject, teacher } = req.body;
        const studentId = req.userId;

        const student = await Student.findById(studentId);
        if (!student || !student.schedule.includes(scheduleId)) {
            return res.status(403).json({ error: 'Немає доступу до цього заняття' });
        }

        const updatedSchedule = await Schedule.findByIdAndUpdate(
            scheduleId,
            { dayOfWeek, time, subject, teacher },
            { new: true }
        );

        if (!updatedSchedule) return res.status(404).json({ error: 'Заняття не знайдено' });

        res.json({ message: 'Заняття оновлено', schedule: updatedSchedule });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Видалити заняття з розкладу студента
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const studentId = req.userId;

        const student = await Student.findById(studentId);
        if (!student || !student.schedule.includes(scheduleId)) {
            return res.status(403).json({ error: 'Немає доступу до цього заняття' });
        }

        const deletedSchedule = await Schedule.findByIdAndDelete(scheduleId);
        if (!deletedSchedule) return res.status(404).json({ error: 'Заняття не знайдено' });

        student.schedule = student.schedule.filter((id) => id.toString() !== scheduleId);
        await student.save();

        res.json({ message: 'Заняття видалено з розкладу' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати розклад студента
router.get('/', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;

        const student = await Student.findById(studentId).populate({
            path: 'schedule',
            populate: [{ path: 'subject' }, { path: 'teacher' }]
        });
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        res.json(student.schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отримати конкретне заняття з розкладу студента
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const studentId = req.userId;

        const student = await Student.findById(studentId);
        if (!student || !student.schedule.includes(scheduleId)) {
            return res.status(403).json({ error: 'Немає доступу до цього заняття' });
        }

        const schedule = await Schedule.findById(scheduleId).populate('subject').populate('teacher');
        if (!schedule) return res.status(404).json({ error: 'Заняття не знайдено' });

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
