const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    surname: { type: String, required: true }, 
    name: { type: String, required: true },    
    fatherName: {type: String, required: true}
});

module.exports = mongoose.model('Teacher', TeacherSchema);
