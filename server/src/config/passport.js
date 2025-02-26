const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const dotenv = require("dotenv");
const crypto = require("crypto");
const User = require("../models/userModel");

dotenv.config();

function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString("hex").slice(0, length); // تحويل البايتات إلى نص
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        console.log("accessToken : ", accessToken);
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            // avatar: profile.photos[0].value,
            password: generateRandomPassword(16),
            accessToken,
          });
        } else {
          user = await User.findOneAndUpdate(
            { googleId: profile.id },
            { accessToken },
            { new: true } 
          );
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // استرجاع بيانات المستخدم بناءً على الـ id
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
