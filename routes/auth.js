const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const GITHUB_CLIENT_ID = "b37866e442e64773319d";
const GITHUB_CLIENT_SECRET = "ae579da9ec362151711c4e5ac2dce2f34a2f3c3f";
const GOOGLE_CLIENT_ID = "78571448370-9mblcbq5fqklnfbuqh5vuuj5qnp43e5q.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

const passport = require('passport');
const express = require('express');

const mongojs = require('mongojs');
const MONGO_URI = 'mongodb://mongodb:27017/grabaciones';
const db = mongojs(MONGO_URI, ['users']);


passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { _id: user._id, githubId: user.githubId, googleId: user.googleId });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:5000/auth/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        db.users.findOne({ googleId: profile.id }, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (user) {
                return cb(null, user);
            } else {
                var newUser = {
                    githubId: undefined,
                    googleId: profile.id,
                    // add any additional profile information you need here
                };
                db.users.save(newUser, function (err, savedUser) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, savedUser);
                });
            }
        });
    }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:5000/auth/github/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        db.users.findOne({ githubId: profile.id }, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (user) {
                return cb(null, user);
            } else {
                var newUser = {
                    githubId: profile.id,
                    googleId: undefined,
                    // add any additional profile information you need here
                };
                db.users.save(newUser, function (err, savedUser) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, savedUser);
                });
            }
        });
    }
));

let app = express.Router();

// Routes for Google OAuth
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        successReturnToOrRedirect: '/recorder'
    }),
);

// Routes for GitHub OAuth
app.get('/auth/github',
    passport.authenticate('github'));

app.get('/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login',
        successReturnToOrRedirect: '/recorder'
    }),
);

module.exports = app;