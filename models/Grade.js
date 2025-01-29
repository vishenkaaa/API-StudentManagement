const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, 
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    grade: { type: Number, required: true }, 
    date: { type: Date, required: true } 
});

module.exports = mongoose.model('Grade', GradeSchema);
