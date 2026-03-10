async function getUserById(req,res){
    const {userId}=req.params;
    // const user=await prisma.user.findUnique({
    //     where:{
    //         userId:parseInt(userId)
    //     }
    // });
    const user={"name":"edena","age":20};
    if (!user){
        return res.status(404).json({message:"User not found"});
    }
    return res.status(200).json(user);
}
module.exports={getUserById};