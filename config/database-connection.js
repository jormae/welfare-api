// const express = require("express");
const mysql = require('mysql2')
require('dotenv').config()


//Mysql Connection
const connection = mysql.createPool({
  connectionLimit : 100,
  host: process.env.HOST_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

exports.getConnection = function(callback) {
  connection.getConnection(function(err, conn) {
    if(err) {
      return callback(err);
    }
    //   connection.query("SET NAMES UTF8");
    console.log("Database Server is successfully connected");
    callback(err, conn);
  });
};

module.exports = connection;
