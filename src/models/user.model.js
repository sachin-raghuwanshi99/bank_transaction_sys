const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true,"Email is required"],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please use a valid email address.'],
        unique: [true, 'Email already exists']
    },
    password: {
        type: String,
        required: [true,"Password is required"],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false

    },
    name:{
        type: String,
        required: [true,"Name is required"],
    }
},{
    timestamps: true
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;

    return;

});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;