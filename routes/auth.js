const express = require("express");
const ExpressError = require("../expressError");
const { SECRET_KEY } = require("../config");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const router = new express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    
    if (user) {
      let token = jwt.sign( {username}, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    } else {
      throw new ExpressError("Invalid username or password!", 400);
    }
  } catch (err) {
    return next(err);
  }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function(req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    const user = await User.register({username, password, first_name, last_name, phone});

    if (user) {
      let token = jwt.sign( {username}, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    } else {
      throw new ExpressError("Registration failed", 400);
    }
  } catch(err) {
    return next(err);
  }
});

 module.exports = router;