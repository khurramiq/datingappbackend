const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.requireSignin = (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (!data) return res.status(401).json({ error: "Token is not valid" });
    req.token = data;    
    next();
  } catch {
    res.status(401).json({ error: "Token is not valid" });
  }
};

exports.userMiddleware = (req, res, next) => {
  if (req.token.role !== "user") {
    return res.status(400).json({ message: "User Access denied" });
  }
  next();
};

exports.adminMiddleware = async (req, res, next) => {  
  if (req.token.role !== "admin") {
    return res.status(200).json({ message: "Admin Access denied" });
  }
  next();
};
