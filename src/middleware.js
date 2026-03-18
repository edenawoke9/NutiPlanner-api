const express=require("express");
const jwt=require("jsonwebtoken");
const SECRET_KEY=process.env.SECRET_KEY;
const app=express();
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; 
  
    if (!token) return res.status(401).json({ error: 'No token provided' });
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded; 
      next();
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  }
  // app.delete('/users/:id', authenticate, requireAdmin, deleteUser);
module.exports={authenticate,requireAdmin};