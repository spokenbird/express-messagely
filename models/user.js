/** User class for message.ly */



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const result = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp)
        RETURNING username, password, first_name, last_name, phone, join_at`,
      [username, password, first_name, last_name, phone]);

    let user = result.rows[0];
    return user;
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT password FROM users WHERE username = $1`,
        [username]);
      const user = result.rows[0];

      if (user) {
        if (await bcrypt.compare(password, user.password) === true) {
          return res.json({ message: "You've logged in successfully!" });
        }
      }
      throw new ExpressError("Invalied username or Password", 400);
    } catch (err) {
      return next(err);
    }
  }
  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
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
    } catch (err) {
      return next(err);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    try {
      const users = await db.query(
        `SELECT username, first_name, last_name, phone
        FROM users
        ORDER BY last_name, first_name`
      )
      return users.rows;
    } catch (error) {
      return next(err);
    }
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
    try {
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
      return 
    } catch (error) {
      return next(err);
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    try {
      const messages = db.query(`
      SELECT m.id, 
      m.to_username AS to_username,
      first_name AS to_first_name,
      last_name AS to_last_name,
      phone AS to_phone,
      m.body,
      m.sent_at, 
      m.read_at
      FROM users
        JOIN messages AS m ON username = m.from_username
      WHERE m.from_username = $1`,
      [username]
      )

      return {
        id: m.id,
        to_user: {
          username: to_username,
          first_name: to_first_name,
          last_name: to_last_name,
          phone: to_phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    } catch (error) {
      return next(err);
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    try {
      const messages = db.query(`
      SELECT m.id, 
      m.from_username AS from_username,
      first_name AS from_first_name,
      last_name AS from_last_name,
      phone AS from_phone,
      m.body,
      m.sent_at, 
      m.read_at
      FROM users
        JOIN messages AS m ON username = m.to_username
      WHERE m.to_username = $1`,
      [username]
      )

      return {
        id: m.id,
        from_user: {
          username: from_username,
          first_name: from_first_name,
          last_name: from_last_name,
          phone: from_phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    } catch (error) {
      return next(err);
    }
  }
}


module.exports = User;