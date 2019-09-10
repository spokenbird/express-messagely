const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const { SECRET_KEY } = require("../config");

let testUserToken1;
let testUserToken2;

describe("Messages Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let user1 = await User.register({
      username: "test1",
      password: "secret",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    
    let user2 = await User.register({
      username: "test2",
      password: "secret",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14159999999",
    });

    const user1payload = { username: "test1" };
    const user2payload = { username: "test2" };
    testUserToken1 = jwt.sign(user1payload, SECRET_KEY);
    testUserToken2 = jwt.sign(user2payload, SECRET_KEY);

    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1"
    });
  })

  describe("GET /users", function () {
    test("can get all users", async function () {
      let resp = await request(app).get("/users").send({_token: testUserToken1});
      expect(resp.body).toEqual({
        users: [{
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
        }, {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14159999999"
        }]
      });
    })
  })

  describe("GET /users/:username", function () {
    test("can get one user", async function () {
      let resp = await request(app).get("/users/test1").send({_token: testUserToken1});
      expect(resp.body).toEqual({
        user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
          join_at:  expect.any(String),
          last_login_at:  expect.any(String)
        }
      });
    })
  })

  describe("GET /users/:username/to", function () {
    test("can get one user", async function () {
      let resp = await request(app).get("/users/test1/to").send({_token: testUserToken1});
      expect(resp.body).toEqual({
        messages: [{
          id: expect.any(Number),
          from_user: {
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14159999999",
            username: "test2",
          },
          body: "u2-to-u1",
          sent_at:  expect.any(String),
          read_at:  null
        }]
      });
    })
  })

  describe("GET /users/:username/from", function () {
    test("can get one user", async function () {
      let resp = await request(app).get("/users/test1/from").send({_token: testUserToken1});
      expect(resp.body).toEqual({
        messages: [{
          id: expect.any(Number),
          to_user: {
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14159999999",
            username: "test2",
          },
          body: "u1-to-u2",
          sent_at:  expect.any(String),
          read_at:  null
        }]
      });
    })
  })


afterAll(async function() {
  await db.end();
})
})