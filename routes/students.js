const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Реєстрація
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(400).json({ error: 'Email вже зареєстровано' });

        const newStudent = new Student({ email, password });
        await newStudent.save();

        res.status(201).json({ message: 'Студент успішно зареєстрований', studentId: newStudent._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Вхід
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({ email });
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(401).json({ error: 'Невірні дані для входу' });

        const token = jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, studentId: student._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Оновлення даних
router.put('/update/:id', async (req, res) => {
    try {
        const { surname, name, dateOfBirth, class: studentClass } = req.body;

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { surname, name, dateOfBirth, class: studentClass },
            { new: true }
        );

        if (!updatedStudent) return res.status(404).json({ error: 'Студента не знайдено' });

        res.json({ message: 'Дані успішно оновлено', student: updatedStudent });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Експорт оцінок студента у Word
router.get('/grades/export', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;
        const student = await Student.findById(studentId).populate({
            path: 'grades',
            populate: { path: 'subject', select: 'name' }, 
        });

        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Звіт про оцінки студента: ${student.surname} ${student.name}`,
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                        }),
                        new Paragraph({
                            text: `Клас: ${student.class || 'Не вказано'}\nДата: ${new Date().toLocaleDateString()}`,
                            spacing: { after: 200 },
                        }),
                        new Paragraph({
                            text: 'Оцінки:',
                            bold: true,
                            spacing: { after: 100 },
                        }),
                        ...student.grades.map((grade) =>
                            new Paragraph({
                                text: `Предмет: ${grade.subject?.name || 'Не вказано'}, Оцінка: ${grade.grade}, Дата: ${new Date(grade.date).toLocaleDateString()}`,
                            })
                        ),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);

        const fileName = `Звіт-${student.surname}.docx`;

        const encodedFileName = encodeURIComponent(fileName);

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        console.error('Помилка експорту у Word:', error);
        res.status(500).json({ error: 'Помилка генерації файлу' });
    }
});


module.exports = router;
