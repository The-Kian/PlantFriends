/**
 * The firebase-admin pieces the functions use, from the modular entry points.
 *
 * firebase-admin 14 removed the namespaced API (`admin.firestore()`,
 * `admin.auth()`, `admin.credential`), so nothing may use it. Everything goes
 * through here instead, which also gives the tests one module to mock.
 * `admin-api.test.js` fails if the old calls come back.
 */
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  FieldValue,
  getFirestore,
  Timestamp,
} = require("firebase-admin/firestore");

module.exports = {
  initializeApp,
  db: () => getFirestore(),
  auth: () => getAuth(),
  FieldValue,
  Timestamp,
};
