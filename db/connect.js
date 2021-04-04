/*
Name of the author:MONISHA MOHAN
Date of creation:09/09/2019
Project Name :PHANTOM
Function Details:Module initiates the mongoClient connection with the database
*/

var MongoClient = require("mongodb").MongoClient;
const CONFIG = require("./../config");

const state = {
  db: null
};
/*function to connect to database*/
module.exports = {
  connect: successfulConnection => {
    if (state.db) {
      successfulConnection(state.db, null);
    } else {
      MongoClient.connect(CONFIG.HOST, {
        poolSize: 5,
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
        .then((db, err) => {
          if (err) {
            if (state.db) {
              state.db.close();
            }
            successfulConnection(null, err);
          } else {
            state.db = db.db(CONFIG.DB_NAME);
            successfulConnection(state.db, null);
          }
        })
        .catch(dberr => {
          successfulConnection(null, dberr);
        });
    }
  }
};
