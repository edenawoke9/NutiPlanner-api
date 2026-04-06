const express = require("express");
const app = express();
const userRouter=require("./routes/userRoute");
const feedbackRouter=require("./routes/feedbackRoute");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const SECRET_KEY = process.env.SECRET_KEY;
app.use("/user",userRouter);
app.use("/feedback",feedbackRouter);
app.listen(4000,()=>{
    console.log("app running on port 4000");
})