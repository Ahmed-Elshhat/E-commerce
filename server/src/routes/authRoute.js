const express = require("express");

const router = express.Router();
const passport = require("passport");
const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyPassResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidator");

const {
  signup,
  login,
  googleCallback,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require("../controllers/authController");

router.route("/signup").post(signupValidator, signup);
router.route("/login").post(loginValidator, login);
router.post("/forgotPassword", forgotPasswordValidator, forgotPassword);
router.post(
  "/verifyResetCode",
  verifyPassResetCodeValidator,
  verifyPassResetCode
);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

// Sign in with google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed",
  }),
  googleCallback
);

// router
//   .route("/:id")
//   .get(getUserValidator, getUser)
//   .put(uploadUserImage, resizeImage, updateUserValidator, updateUser)
//   .delete(deleteUserValidator, deleteUser);

module.exports = router;
