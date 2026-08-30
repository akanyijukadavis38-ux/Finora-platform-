const express = require("express");
const User = require("./user");

const router = express.Router();


/* =====================================================
   REGISTER USER
===================================================== */

router.post("/register", async (req, res) => {

    try {

        const {
            fullName,
            phone,
            email,
            password,
            confirmPassword,
            referralCode
        } = req.body;


        /* =============================================
           BASIC VALIDATION
        ============================================= */

        if (
            !fullName ||
            !phone ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message: "All required fields must be provided."
            });

        }


        /* =============================================
           PHONE VALIDATION
        ============================================= */

        if (!/^07[0-9]{8}$/.test(phone)) {

            return res.status(400).json({
                success: false,
                message: "Enter a valid Uganda phone number."
            });

        }


        /* =============================================
           EMAIL VALIDATION
        ============================================= */

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }


        /* =============================================
           PASSWORD VALIDATION
        ============================================= */

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });

        }


        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });

        }


        /* =============================================
           CHECK EXISTING EMAIL
        ============================================= */

        const existingEmail = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingEmail) {

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });

        }


        /* =============================================
           CHECK EXISTING PHONE
        ============================================= */

        const existingPhone = await User.findOne({
            phone: phone
        });

        if (existingPhone) {

            return res.status(409).json({
                success: false,
                message: "An account with this phone number already exists."
            });

        }


        /* =============================================
           CREATE USER
        ============================================= */

        const user = await User.create({

            fullName: fullName.trim(),

            phone: phone.trim(),

            email: email
                .trim()
                .toLowerCase(),

            password: password,

            referralCode:
                referralCode
                    ? referralCode.trim()
                    : null

        });


        /* =============================================
           RESPONSE
        ============================================= */

        return res.status(201).json({

            success: true,

            message: "FINORA account created successfully.",

            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                referralCode: user.referralCode,
                balance: user.balance,
                totalIncome: user.totalIncome,
                totalDeposit: user.totalDeposit,
                totalWithdrawal: user.totalWithdrawal,
                status: user.status,
                createdAt: user.createdAt
            }

        });

    } catch (error) {

        console.error(
            "❌ FINORA REGISTRATION ERROR:",
            error
        );


        /* =============================================
           DUPLICATE KEY ERROR
        ============================================= */

        if (error.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "An account with those details already exists."
            });

        }


        return res.status(500).json({

            success: false,

            message:
                "FINORA could not create the account. Please try again."

        });

    }

});


module.exports = router;
