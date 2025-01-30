const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const StudentSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    surname: { type: String },
    name: { type: String },
    dateOfBirth: { type: Date },
    class: { type: String },
    grades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }], 
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], 
    schedule: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }] 
});

StudentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('Student', StudentSchema);
