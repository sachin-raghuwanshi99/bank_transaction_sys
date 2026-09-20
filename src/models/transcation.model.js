const mongoose = require('mongoose');


const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, "Transaction must belong to an account"],
        index: true 
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, "Transaction must belong to an account"],
        index: true 
    },
    status: {
        type: String,
        enum:{
            values: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
            message: 'Status is either: PENDING, COMPLETED, FAILED or REVERSED',
        },
        default: 'PENDING'
    },
    amount: {
        type: Number,
        required: [true, "Transaction must have an amount"],
        min: [0, "Transaction amount must be greater than 0"]
    },
    idempotencyKey: {
        type: String,
        required: [true, "Transaction must have an idempotency key"],
        index: true,
        unique: true
    }
}, {timestamps: true});

const transctionModel = mongoose.model('transaction', transactionSchema);


module.exports = transctionModel;