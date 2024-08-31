const ErrorHander = require("../utils/errorhander")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")

const User = require("../models/userModel");
const crypto = require("crypto")
const sendToken = require("../utils/jwtToken")
const sendEmail = require("../utils/sendEmail")
//Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const { name, email, password } = req.body;

    const user = await User.create({
        name, email, password,
        avatar: {
            public_id: "this is a sample id",
            url: "Profileurl"
        }
    })
    sendToken(user, 201, res)

})


// login user 
exports.loginUser = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHander("Please Enter Email & Password", 400))

    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        return next(new ErrorHander("Invalid Email or Password", 401))
    }


    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHander("Invalid Email or Password", 401))
    }

    sendToken(user, 200, res)

})


//logout user 
exports.logout = catchAsyncErrors(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
})


//forget password 

exports.forgetPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHander("User Not found", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl}\n\n If you have not requested this email then please ignore it.`;

    try {
        await sendEmail({
            email: user.email, // Corrected typo: "emil" was mistakenly written instead of "email"
            subject: `Ecommerce Password Recovery`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHander(error.message, 500));
    }

});


//reset password 

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorHander("Reset Password tokken is invalid or has been expired ", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHander("Password doesnot matched", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res)
})

// get user detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })

})


//update user password 
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password")

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHander("Old Password is incorrect", 400))
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHander("Passwor doesnot match", 400))
    }
    user.password = req.body.newPassword
    await user.save()
    sendToken(user, 200, res)

})



//update user profile 
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {


    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    //update cloudinary later
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true
    })

})

//get all users (admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {

    const users = await User.find()

    res.status(200).json({
        success: true,
        users
    })
})

//get all single users (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHander(`User does not exist with id : ${req.params.id}`))
    }


    res.status(200).json({
        success: true,
        users
    })
})


