const mongoose = require('mongoose');
const { getConfig } = require('../config');

const ScheduleSchema = new mongoose.Schema({
    dayOfWeek: { type: Number, required: true },
    lessonNumber: { type: Number, required: true },
    time: { type: String, required: false },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
});

// Роозрахунок часу уроку
function calculateLessonTime(lessonNumber) {
    const config = getConfig();
    
    let startTime = config.lessonStartTime.split(":").map(Number);
    let hours = startTime[0];
    let minutes = startTime[1];

    for (let i = 1; i < lessonNumber; i++) {
        minutes += 45;
        if (i === config.bigBreakAfter) {
            minutes += config.bigBreakDuration;
        } else {
            minutes += config.smallBreakDuration;
        }

        if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes %= 60;
        }
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

ScheduleSchema.pre('save', function (next) {
    this.time = calculateLessonTime(this.lessonNumber);
    next();
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
