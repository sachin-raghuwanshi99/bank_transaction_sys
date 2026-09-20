const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');




async function authMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access."
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                status: "fail",
                message: "The user belonging to this token does no longer exist."
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid token. Please log in again."
        });
    }
}

module.exports ={
    authMiddleware
} 