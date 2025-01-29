const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    hoursPerWeek: { type: Number, required: true } 
});

module.exports = mongoose.model('Subject', SubjectSchema);
