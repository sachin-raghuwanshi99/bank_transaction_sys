const transcationModel = require('../models/transcation.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.service');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose')

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransaction(req, res) {


    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            status: "fail",
            message: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey"
        })
    }

    const fromUserAccount = await accountModel.findOne({ 
        _id: fromAccount,
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            status: "fail",
            message: "One or both accounts not found"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transcationModel.findOne({ idempotencyKey });

    if (isTransactionAlreadyExists) {
        if(isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already completed",
                transaction: isTransactionAlreadyExists
            });
        }

        if(isTransactionAlreadyExists.status === "PENDING") {
            return res.status(202).json({
                message: "Transaction is still pending",
            });
        }

        if(isTransactionAlreadyExists.status ==="FAILED"){
            return res.status(500).json({
                message:"Transaction failed, try again"
            })
        }

        if(isTransactionAlreadyExists.status ==="REVERSED"){
            return res.status(500).json({
                message:"Transaction was reversed, try again"
            })
        }



    }

    /**
     * 3. Check account status
     */

    if(fromUserAccount.status !=="ACTIVE" || toUserAccount.status !=="ACTIVE"){
        return res.status(400).json({
            message:"both fron and to acc must be active to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance. current balance ${balance}. Requested amount is ${amount}`
        })
    }

    /**
     * 5. Create transaction (PENDING)
     */

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transcationModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    },{session})

    /**
     * 6. Create DEBIT ledger entry
     */

    const debitLedgerEntry = await ledgerModel.create({
        account : toAccount,
        amount : amount,
        transaction: transaction._id,
        type: "DEBIT"
    },{session})

    /**
     * 7. Create CREDIT ledger entry
     */
            
    const creditLedgerEntry = await ledgerModel.create({
        account : toAccount,
        amount : amount,
        transaction: transaction._id,
        type: "CREDIT"
    },{session})

    /**
     *  8. Mark transaction COMPLETED
     */

    transaction.status = "COMPLETED"
    await transaction.save({session})

    /**
     * 9. Commit MongoDB session
     */
    await session.commitTransaction()
    session.endSession()

    /**
     * 10. Send email notification
    */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.ststus(201).json({
        message:"Transaction completed",
        transaction: transaction
    })
    
}

module.exports ={
        createTransaction
    }