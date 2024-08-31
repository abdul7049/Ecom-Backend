const Errorhander=require("../utils/errorhander")

module.exports=(err,req,res,next)=>{

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "internal server error"


    if(err.name=== "CastError"){
        const message=`resource not found invalid :${err.path}`
        err=new Errorhander(message,400)
    }

    //mongoose duplicate key error

    if(err.code=== 11000){
        const message=`Duplicate ${Object.keys(err.keyValue)} Entered`
        err=new Errorhander(message,400)
    }

    //Wrong Jwt Token
    if(err.name=== "jsonWebTokenError"){
        const message=`Json web tokken is invalid , try again`
        err=new Errorhander(message,400)
    }

    //jwt expire error

    if(err.name=== "TokenExpiredError"){
        const message=`Json web tokken is expired , try again`
        err=new Errorhander(message,400)
    }

    res.status(err.statusCode).json({
        success:false,
        message:err.stack
    })
}