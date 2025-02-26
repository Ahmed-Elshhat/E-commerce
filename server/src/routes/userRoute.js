const express = require("express");

const router = express.Router();
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  getUsersValidator,
} = require("../utils/validators/userValidator");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getOneWithToken,
  createFilterObj,
  createUserValidatorMiddleware
} = require("../controllers/userController");

const AuthService = require("../controllers/authController");

router.put(
  "/changePassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

router.use(AuthService.protect);

router.get("/getOne", getOneWithToken);

router
  .route("")
  .get(
    AuthService.allowedTo("admin"),
    createFilterObj,
    getUsersValidator,
    getUsers
  )
  .post(
    AuthService.allowedTo("admin"),
    createUserValidator,
    createUserValidatorMiddleware,
    createUser
  );

router
  .route("/:id")
  .get(AuthService.allowedTo("admin"), getUserValidator, getUser)
  .put(
    AuthService.allowedTo("user", "admin"),
    updateUserValidator,
    updateUser
  )
  .delete(AuthService.allowedTo("admin"), deleteUserValidator, deleteUser);

module.exports = router;
