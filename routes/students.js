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

// Генерація звітів про оцінки учнів та експорт у Word
router.get('/grades/export', authMiddleware, async (req, res) => {
    try {
        const studentId = req.userId;

        const student = await Student.findById(studentId).populate('grades');
        if (!student) return res.status(404).json({ error: 'Студента не знайдено' });

        // Створення документа Word
        const doc = new Document();

        // Додавання заголовку
        doc.addSection({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Звіт про оцінки студента ${student.surname} ${student.name}`,
                            bold: true,
                            size: 28,
                        }),
                    ],
                }),
                new Paragraph({
                    text: `Клас: ${student.class || 'Не вказано'}\nДата: ${new Date().toLocaleDateString()}`,
                    spacing: { after: 200 },
                }),
            ],
        });

        // Додавання оцінок
        if (student.grades.length > 0) {
            doc.addSection({
                children: student.grades.map((grade) =>
                    new Paragraph({
                        text: `Предмет: ${grade.subject || 'Не вказано'}, Оцінка: ${grade.grade}, Дата: ${grade.date.toISOString().split('T')[0]}`,
                    })
                ),
            });
        } else {
            doc.addSection({
                children: [
                    new Paragraph({
                        text: 'Оцінок немає.',
                        italics: true,
                    }),
                ],
            });
        }

        // Генерація файлу Word
        const buffer = await Packer.toBuffer(doc);

        // Відправка файлу у відповідь
        const fileName = `grades-report-${student._id}.docx`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
