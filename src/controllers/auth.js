const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const fetch = require("node-fetch");

const client = new OAuth2Client(
  "331445506438-ebeesa88re30sm8h3sbn8mn4mrnm8m3t.apps.googleusercontent.com"
);

exports.signup = async (req, res) => {
  try {
    const newUser = {
      ...req.body,
      profilePic: req.files.profilePic[0].filename,
    };
    var user = await User.findUserByEmail(req.body.email);
    if (!user) {
      user = await User.create(newUser);
      var token = await user.generateAuthToken();
      res.status(200).json({ token: token });
    } else res.json({ error: "User with this email is already registered." });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.signin = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    var user = await User.findUserByCredentials(email, password);
    if (!user) return res.json({ error: "Email or password is incorrect" });
    else {
      if (rememberMe) {
        var token = await user.generateAuthTokenForRememberMe();
      } else {
        var token = await user.generateAuthToken();
      }
      res.status(200).json({ token: token });
    }
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.googlelogin = async (req, res) => {
  const { tokenId } = req.body;
  try {
    client
      .verifyIdToken({
        idToken: tokenId,
        audience:
          "331445506438-ebeesa88re30sm8h3sbn8mn4mrnm8m3t.apps.googleusercontent.com",
      })
      .then(async (response) => {
        const { email_verified, name, email } = response.payload;
        if (email_verified) {
          var user = await User.findUserByEmail(email);
          if (user) {
            var token = await user.generateAuthToken();
            res.status(200).json({ token: token });
          } else {
            let userData;
            let password = email + process.env.JWT_SECRET;
            userData = {
              name,
              email,
              password,
              loginMethod: "google",
            };
            user = await User.create(userData);
            var token = await user.generateAuthToken();
            res.status(200).json({ token: token });
          }
        }
      });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.facebooklogin = async (req, res) => {
  const { accessToken, userID } = req.body;
  try {
    let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id, name, email, picture&access_token=${accessToken}`;
    fetch(urlGraphFacebook, {
      method: "GET",
    })
      .then((response) => response.json())
      .then(async (response) => {
        const { email, name } = response;
        var user = await User.findUserByEmail(email);
        if (user) {
          var token = await user.generateAuthToken();
          res.status(200).json({ token: token });
        } else {
          let userData;
          let password = email + process.env.JWT_SECRET;
          userData = {
            name,
            email,
            password,
            loginMethod: "facebook",
          };
          user = await User.create(userData);
          var token = await user.generateAuthToken();
          res.status(200).json({ token: token });
        }
      });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.profile = async (req, res) => {
  try {
    var user = await User.getUserById(req.token._id);
    if (!user) return res.json({ error: "User is not registered" });
    res.status(200).json({ user: user });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const searchText = req.params.searchText;
    var students = await User.searchStudentsBySearchText(searchText);
    res.status(200).json({ students });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    var admins = await User.allAdmins();
    res.status(200).json({ admins });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.getAdmin_Id = async (req, res) => {
  try {
    var adminId = await User.getAdminId();
    res.status(200).json({ adminId });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.clear_Notification = async (req, res) => {
  console.log("clear_Notification hit");
  try {
    await User.clearNotification(req.body.userId, req.body.notificationId);
    var user = await User.getUserById(req.body.userId);
    res.status(200).json({ user });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.getuserbyid = async (req, res) => {
  try {
    var user = await User.getUserById(req.params.userId);
    if (!user) return res.json({ error: "User is not registered" });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.fetchAllUsers = async (req, res) => {
  try {
    let allUsers = await User.findAllUsers();
    res.status(200).json({ allUsers });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.update_Password = async (req, res) => {
  try {
    var { email, password } = req.body;
    var user = await User.findUserByEmail(email);
    var _user = await User.updatePassword(user._id, password);
    // Generate Notification for Reset Password
    let notification = {
      title: "Password Reset Notification",
      text: "We noticed the password for your account was recently changed. If this was you, you can safely disregard this message. If you are not aware of the change, please, contact us as soon as possible.",
      count: 1,
      date: new Date(),
    };
    await User.addNotification(user._id, notification);
    res.status(200).json({ passwordChanged: true });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.add_ToLikeList = async (req, res) => {
  try {
    var { userId, likePersonId } = req.body;
    await User.addToLikeList(userId, { likePersonId: likePersonId });
    const user = await User.findOne({ _id: userId }, { password: 0 });
    res.status(200).json({ user });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};

exports.details = async (req, res) => {
  try {
    var user = await User.getUserById(req.params._id);
    if (!user) return res.json({ error: "User is not registered" });
    res.status(200).json({ user: user });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
};
