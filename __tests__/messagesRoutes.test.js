const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");


describe("Messages Routes Test". function() {
  beforeEach(async function() {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    
  })










})