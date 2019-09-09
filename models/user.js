/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPW, first_name, last_name, phone]);

    let user = result.rows[0];
    return user;
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    return user && await bcrypt.compare(password, user.password);
  }
  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $1
          RETURNING username, last_login_at`,
      [username]);
    if (result.rows[0].length === 0) {
      throw new ExpressError(`User ${username} does not exist.`);
    }

    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const users = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users
        ORDER BY last_name, first_name`
    )
    return users.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const user = await db.query(
      `SELECT username, 
        first_name, 
        last_name, 
        phone, 
        join_at, 
        last_login_at
        FROM users
        where username = $1`,
      [username]
    )
    const result = user.rows[0];
    if (result.length === 0) {
      throw new ExpressError(`User ${username} not found.`)
    }
    return result;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`
      SELECT m.id, 
      m.to_username AS to_username,
      first_name AS to_first_name,
      last_name AS to_last_name,
      phone AS to_phone,
      m.body,
      m.sent_at, 
      m.read_at
      FROM messages AS m
        JOIN users ON m.to_username = username
      WHERE from_username = $1`,
      [username]
    )
    const messages = results.rows;

    return messages.map(msg => (
      {
      id: msg.id,
      to_user: {
        username: msg.to_username,
        first_name: msg.to_first_name,
        last_name: msg.to_last_name,
        phone: msg.to_phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }
    ));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`
      SELECT m.id, 
      m.from_username AS from_username,
      first_name AS from_first_name,
      last_name AS from_last_name,
      phone AS from_phone,
      body,
      sent_at, 
      read_at
      FROM users
        JOIN messages AS m ON username = m.from_username
      WHERE m.to_username = $1`,
      [username]
    )
    
    const messages = results.rows;

    return messages.map(msg => (
      {
      id: msg.id,
      from_user: {
        username: msg.from_username,
        first_name: msg.from_first_name,
        last_name: msg.from_last_name,
        phone: msg.from_phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }
    ));
  }
}

module.exports = User;