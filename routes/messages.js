const express = require("express");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

const Message = require("../models/message");

const router = new express.Router();



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

 router.get("/:id", ensureLoggedIn, async function(req, res, next) {
   try {
     const message = await Message.get(req.params.id);

     return res.json({ message });
   } catch (err) {
     return next(err);
   }
 });

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
 router.post("/", ensureLoggedIn, async function(req, res, next) {
   try {
     const {from_username, to_username, body} = req.body;
     const message = await Message.create({ from_username, to_username, body });

    return res.json({ message });
   } catch (err) {
     return next(err);
   }
 });

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, ensureCorrectUser, async function(req, res, next) {
  try {
    const id = req.params.id;
    const message = await Message.markRead(id);

    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;