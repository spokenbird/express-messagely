const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const { SECRET_KEY } = require("../config");

let testUserToken1;
let testUserToken2;
let m1;

describe("Messages Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let user1 = await User.register({
      username: "test1",
      password: "secret",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000"
    });

    let user2 = await User.register({
      username: "test2",
      password: "secret",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14159999999"
    });

    const user1payload = { username: "test1" };
    const user2payload = { username: "test2" };
    testUserToken1 = jwt.sign(user1payload, SECRET_KEY);
    testUserToken2 = jwt.sign(user2payload, SECRET_KEY);

    m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1"
    });
  });

  describe("GET /messages/:id", function () {
    test("can get 1 message", async function () {
      let resp = await request(app).get(`/messages/${m1.id}`).send({ _token: testUserToken1 });
      expect(resp.body).toEqual({
        message: {
          id: expect.any(Number),
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000"
          },
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14159999999"
          }
        }
      });
    });
  });

  afterAll(async function () {
    await db.end();
  })
})