const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/userModel');
const { welcomeCode } = require('./email');

const getCallbackURL = (provider) => {
  const baseURL = process.env.BACKEND_URL || 'http://localhost:8080';
  return `${baseURL}/user/auth/${provider}/callback`;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: getCallbackURL('google')
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            if (user.authProvider !== 'google' && user.authProvider !== 'local') {
              return done(null, false, { message: `Email already registered with ${user.authProvider}` });
            }
            return done(null, user);
          }

          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            authProvider: 'google',
            providerId: profile.id,
            avatar: profile.photos[0]?.value,
            isVerified: true
          });

          await user.save();
          await welcomeCode(user.email, user.name);
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: getCallbackURL('github'),
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          let user = await User.findOne({ email });

          if (user) {
            if (user.authProvider !== 'github' && user.authProvider !== 'local') {
              return done(null, false, { message: `Email already registered with ${user.authProvider}` });
            }
            return done(null, user);
          }

          user = new User({
            name: profile.displayName || profile.username,
            email,
            authProvider: 'github',
            providerId: profile.id,
            avatar: profile.photos[0]?.value,
            isVerified: true
          });

          await user.save();
          await welcomeCode(user.email, user.name);
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: getCallbackURL('facebook'),
        profileFields: ['id', 'displayName', 'emails', 'photos']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          let user = await User.findOne({ email });

          if (user) {
            if (user.authProvider !== 'facebook' && user.authProvider !== 'local') {
              return done(null, false, { message: `Email already registered with ${user.authProvider}` });
            }
            return done(null, user);
          }

          user = new User({
            name: profile.displayName,
            email,
            authProvider: 'facebook',
            providerId: profile.id,
            avatar: profile.photos[0]?.value,
            isVerified: true
          });

          await user.save();
          await welcomeCode(user.email, user.name);
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
