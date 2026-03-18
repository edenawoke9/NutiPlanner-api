const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const SECRET_KEY=process.env.SECRET_KEY;
async function getUserById(req,res){
    const {userId}=req.params;
  
    const user={"name":"edena","age":20};
    if (!user){
        return res.status(404).json({message:"User not found"});
    }
    return res.status(200).json(user);
}
async function createUser(req,res){
    const bodyData=req.body;
    console.log(bodyData);
    try{
    const user=await prisma.user.create({
        data:{
            
        
        username:bodyData.username,
        email:bodyData.email,
        password:await bcrypt.hash(bodyData.password,10),
        role:bodyData.role
    }
       
       
        
    });
    return res.status(201).json(user);
}catch(error){
    console.log(error);
        return res.status(500).json({message:"Internal server error"});
    }
  
}
async function loginUser(req,res){
    const {email,password}=req.body;
    const user=await prisma.user.findUnique({
        where:{email:email}
    });
    if(!user){
        return res.status(404).json ({message:"user not found"});
    }
    if(!await bcrypt.compare(password,user.password)){
        return res.status(401).json({message:"invalid password"});
    }
    const token=jwt.sign({userId:user.userId},SECRET_KEY,{expiresIn:"7d"});
    return res.status(200).json({message:"login successful",token:token});
}
module.exports={getUserById,createUser,loginUser};