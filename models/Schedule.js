const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    dayOfWeek: { type: String, required: true },
    time: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }, 
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);