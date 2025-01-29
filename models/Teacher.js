const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    surname: { type: String, required: true }, 
    name: { type: String, required: true },    
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
});

module.exports = mongoose.model('Teacher', TeacherSchema);
