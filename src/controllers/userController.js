const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
dotenv.config();    
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
        return res.status(500).json({message:"Internal server error",error:error});
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
    return res.status(200).json({message:"login successful",token:token,userId:user.userId});
}
async function updateUserInfo(req,res){
    const data=req.body;
    const userId=parseInt(req.params.userId);
    const user=await prisma.user.findUnique({
        where: {userId:userId}
    });
    if (!user){
       return  res.status(404).json({message:"user not found",error:error})
    }
    try{
        const response=await prisma.user.updateUserInfo({
            where:{userId:userId},
            data:{
                userInfo:{
                    upsert:{
                        where:{userId:userId},
                        create:data,
                        update:data
                    }
                }   
            }
          
            
        })
        console.log(response);
        res.status(201).json({message:"User Info Updated",data:response});

        
    }
    
    catch(error){
        res.status(500).json({message:"server error"})
        console.log(error);
    }};
async function updateUser(req,res){
    const data=req.body;
    const userId=parseInt(req.params.userId);
    const user=await prisma.user.findUnique({
        where:{userId:userId}
    });
    if(!user){
        return res.status(404).json({message:"user not found"})
    } 
    try{
        const response = await prisma.user.update({
            where: { userId: userId },
            data: {
                username: data.username,
                email: data.email,
                role: data.role,
                ...(data.password && { password: await bcrypt.hash(data.password, 10) })
            }
        });
        res.status(201).json({message:"User Updated",data:response});}
    catch(error){
        res.status(500).json({message:"server error"})
        console.log(error);
    }
      }
async function deleteUser(req,res){
    const userId=req.params.userId;
    const user=await prisma.user.findUnique({
        where:{userId:userId}
    })
    if(!user){
        return res.status(404).json({message:"user not found"})
    }
    try{
        const response=await prisma.user.delete({
            where:{userId:userId}
        })
        res.status(201).json({message:"User Deleted"})

    }
    catch(error){
        res.status(500).json({message:"server error"})
    }
}



module.exports={getUserById,createUser,loginUser,updateUserInfo,deleteUser,updateUser};
