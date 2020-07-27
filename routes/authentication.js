const express = require('express');
const bcryptjs = require('bcryptjs');

const User = require('./../models/user');
const routeAuthenticationGuard = require('./../middleware/route-authentication-guard');

const authenticationRouter = new express.Router();

authenticationRouter.get('/sign-up', (req, res, next) => {
  res.render('authentication/sign-up');
});

authenticationRouter.post('/sign-up', (req, res, next) => {
  const { username, password } = req.body;

  bcryptjs
    .hash(password, 12)
    .then(hashAndSalt => {
      return User.create({
        username,
        password: hashAndSalt
      });
    })
    .then(user => {
      console.log(req.session);
      req.session.userId = user._id;
      res.redirect('/');
    })
    .catch(error => {
      next(error);
    });
});

authenticationRouter.get('/sign-in', (req, res, next) => {
  res.render('authentication/sign-in');
});

authenticationRouter.post('/sign-in', (req, res, next) => {
  const { username, password } = req.body;

  let user;

  User.findOne({ username })
    .then(document => {
      user = document;
      if (!user) {
        return Promise.reject(new Error('That username is not registered.'));
      }
      const hashAndSalt = user.password;
      return bcryptjs.compare(password, hashAndSalt);
    })
    .then(comparison => {
      if (comparison) {
        req.session.userId = user._id;
        res.redirect('/');
      } else {
        const error = new Error('Password did not match.');
        return Promise.reject(error);
      }
    })
    .catch(error => {
      res.render('authentication/sign-in', { error: error });
    });
});

authenticationRouter.get('/main', routeAuthenticationGuard, (req, res, next) => {
  res.render('main');
});

authenticationRouter.get('/private', routeAuthenticationGuard, (req, res, next) => {
  res.render('private');
});

authenticationRouter.get('/profile', routeAuthenticationGuard, (req, res, next) => {
  res.render('authentication/profile');
});

authenticationRouter.get('/profile/edit', routeAuthenticationGuard, (req, res, next) => {
  res.render('authentication/profile-edit');
});

authenticationRouter.post('/profile/edit', routeAuthenticationGuard, (req, res, next) => {
  const { _id, username, name, password } = req.body;
  console.log(req.body);
  let user;
  User.findByIdAndUpdate(_id, { username: user.username, name: user.name, password: user.password })
    .then(() => {
      res.redirect('/authentication/profile');
    })
    .catch(error => {
      next(error);
    });
});

authenticationRouter.post('/sign-out', (req, res) => {
  req.session.destroy();
  res.redirect('/authentication/sign-in');
});

module.exports = authenticationRouter;
