const express = require("express");
const {
  fetchAllUsers,
  add_ToLikeList,
  signup,
  signin,
  profile,
  details,
  update_Password,
  getuserbyid,
  clear_Notification,
} = require("../controllers/auth");
const { requireSignin } = require("../middlewares");
const router = express.Router();

const multer = require("multer");
const shortid = require("shortid");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(path.dirname(__dirname), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, shortid.generate() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

router.post(
  "/signup",
  upload.fields([
    {
      name: "profilePic",
      maxCount: 1,
    },
  ]),
  signup
);
router.post("/signin", signin);
router.post("/add_ToLikeList", add_ToLikeList);
router.post("/clear_notification", requireSignin, clear_Notification);
router.post("/change_password", update_Password);
router.get("/profile", requireSignin, profile);
router.get("/fetchAllUsers", fetchAllUsers);
router.get("/details/:_id", requireSignin, details);
router.get("/userById/:userId", getuserbyid);

module.exports = router;
