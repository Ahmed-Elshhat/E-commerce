const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    accessToken: String,
    googleId: {
      type: String,
      unique: [true, "google ID must be unique"],
    },
    name: {
      type: String,
      trim: true,
      required: [true, "name is required"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email must be unique"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: [6, "Too short password"],
    },
    phone: String,
    startShift: Number,
    endShift: Number,
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,

    role: {
      type: String,
      enum: ["user", "employee", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    addresses: [
      {
        id: { type: mongoose.Schema.Types.ObjectId },
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
