const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Create Schema
const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  interestedInAge: { type: String, required: true },
  interestedInGender: { type: String, required: true },
  desc: { type: String, required: true },
  profilePic: { type: String, required: true },
  likeList: [],
  notifications: [
    {
      title: { type: String },
      text: { type: String },
      count: { type: Number },
      date: { type: Date },
    },
  ],
  created: { type: Date, default: Date.now },
  updated: { type: Date },
});

//Store Encrypted Password When Creating Account
UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password"))
    user.password = await bcrypt.hash(user.password, 10);
  next();
});

//Generate JWT Token
UserSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  return token;
};

//Generate JWT Token For Remember Me
UserSchema.methods.generateAuthTokenForRememberMe = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "365d",
    }
  );
  return token;
};

//Find using email and check if the password matched
UserSchema.statics.findUserByCredentials = async (email, password) => {
  const user = await User.findOne({ email }, { _id: 1, password: 1 });
  if (!user) throw new Error("Invalid login credentials");
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) throw new Error("Invalid login credentials");
  return user;
};

UserSchema.statics.findUserByEmail = async (email) => {
  const user = await User.findOne({ email }, { password: 0 });
  return user;
};

UserSchema.statics.findAllStudents = async () => {
  const students = await User.find({ role: "student" }, { password: 0 });
  return students;
};
UserSchema.statics.findAllUsers = async () => {
  const users = await User.find({}, { password: 0 });
  return users;
};

UserSchema.statics.getAdminId = async () => {
  const user = await User.findOne({ role: "admin" }, { password: 0 });
  return user._id;
};

UserSchema.statics.getUserById = async (_id) => {
  const user = await User.findOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { password: 0 }
  );
  return user;
};

UserSchema.statics.searchStudentsBySearchText = async (searchText) => {
  const users = await User.find({ name: new RegExp(searchText, "i") });
  console.log(users);
  return users;
};

UserSchema.statics.allAdmins = async () => {
  const users = await User.find({ role: "admin" });
  console.log(users);
  return users;
};

UserSchema.statics.getAllUser = async (_id) => {
  const user = await User.find({});
  return user;
};

UserSchema.statics.getAllTeachers = async () => {
  const Teachers = await User.find({ role: "teacher" }, { password: 0 });
  return Teachers;
};

UserSchema.statics.deleteUser = async (_id) => {
  const del = await User.deleteOne({ _id: mongoose.Types.ObjectId(_id) });
  return del;
};

UserSchema.statics.updateActive = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { isActive: val } }
  );
  return upt;
};

UserSchema.statics.updateLastLearn = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { lastLearned: val } }
  );
  return upt;
};

UserSchema.statics.updatePasswordResetAttempts = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { passwordResetAttempts: val } }
  );
  return upt;
};

UserSchema.statics.updateCanResetPassword = async (_id, val) => {
  var a = new Date();
  a.setDate(a.getDate() + 1);
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    {
      $set: {
        canResetPassword: val,
        cannotLoginBefore: a,
        passwordResetAttempts: 10,
      },
    }
  );
  return upt;
};

UserSchema.statics.updateAccountEnabled = async (_id, val) => {
  const user = await User.findOne({ _id });
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    {
      $set: {
        accountEnabled: !user.accountEnabled,
      },
    }
  );
  return upt;
};

UserSchema.statics.updatePassword = async (_id, val) => {
  let hashPass = await bcrypt.hash(val, 10);
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { password: hashPass } }
  );
  return upt;
};

UserSchema.statics.updateExperience = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { experience: val } }
  );
  return upt;
};

UserSchema.statics.enrollCourse = async (
  _id,
  course,
  chapterId,
  lessonId,
  quizId,
  lastLessonId,
  lastChapterId
) => {
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $push: {
        coursesEnrolled: {
          course: {
            course: course._id,
            courseTitle: course.title,
            startedLearning: new Date(),
            recentChapter: chapterId,
            recentLesson: lessonId,
            recentQuiz: quizId,
            lastLesson: lastLessonId,
            lastChapter: lastChapterId,
          },
        },
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.addNotification = async (_id, notification) => {
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $push: {
        notifications: notification,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.addToLikeList = async (_id, like) => {
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $push: {
        likeList: like,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateRecentCourse = async (_id, courseId) => {
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $set: {
        recentCourse: courseId,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.clearNotification = async (_id, notificationId) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "notifications._id": notificationId,
    },
    { $set: { "notifications.$.count": 0 } },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateRecentQuiz = async (_id, courseId, nextQuizId) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    { $set: { "coursesEnrolled.$.course.recentQuiz": nextQuizId } },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.resetStudentCourseProgress = async (
  _id,
  courseId,
  lessonId,
  quizId,
  chapterId,
  lastLesson,
  lessonsCompleted
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.recentQuiz": quizId,
        "coursesEnrolled.$.course.recentChapter": chapterId,
        "coursesEnrolled.$.course.recentLesson": lessonId,
        "coursesEnrolled.$.course.lastLesson": lastLesson,
        "coursesEnrolled.$.course.lessonsCompleted": lessonsCompleted,
        "coursesEnrolled.$.course.courseCompleted": false,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateCourseProgress = async (
  _id,
  courseId,
  courseProgress
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.courseProgress": courseProgress,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateRecentLesson = async (
  _id,
  courseId,
  nextQuizId,
  nextLessonId
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.recentQuiz": nextQuizId,
        "coursesEnrolled.$.course.recentLesson": nextLessonId,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateCourseAccess = async (_id, courseId, courseAccess) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.updateAccess": courseAccess,
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateRecentChapter = async (
  _id,
  courseId,
  nextQuizId,
  nextLessonId,
  nextChapterId,
  lastLesson
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.recentQuiz": nextQuizId,
        "coursesEnrolled.$.course.recentLesson": nextLessonId,
        "coursesEnrolled.$.course.recentChapter": nextChapterId,
        "coursesEnrolled.$.course.lastLesson": lastLesson,
      },
    },
    { new: true }
  );
  console.log("updateRecentLesson");
  return updatedUser;
};

UserSchema.statics.updateCourseCompleted = async (_id, courseId) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $set: {
        "coursesEnrolled.$.course.courseCompleted": true,
        "coursesEnrolled.$.course.courseCompletedOn": new Date(),
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.addLessonToCompleteList = async (
  _id,
  courseId,
  lessonId
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $push: {
        "coursesEnrolled.$.course.lessonsCompleted": { lesson: lessonId },
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.addChapterToCompleteList = async (
  _id,
  courseId,
  chapterId
) => {
  const updatedUser = await User.updateOne(
    {
      _id: _id,
      "coursesEnrolled.course.course": courseId,
    },
    {
      $push: {
        "coursesEnrolled.$.course.chapersCompleted": { chapter: chapterId },
      },
    },
    { new: true }
  );
  return updatedUser;
};

UserSchema.statics.updateAcceptTerms = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { acceptTerms: val, profileCompleted: true } }
  );
  return upt;
};

UserSchema.statics.updateSecurityQuestions = async (_id, val) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { securityQuestions: val } }
  );
  return upt;
};

UserSchema.statics.updateApproved = async (_id) => {
  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    { $set: { isApproved: true } }
  );
  return upt;
};

UserSchema.statics.updateProfile = async (
  _id,
  email,
  password,
  name,
  alias,
  role
) => {
  const pass = await bcrypt.hash(password, 10);

  const upt = await User.updateOne(
    { _id: mongoose.Types.ObjectId(_id) },
    {
      $set: {
        email,
        name,
        alias,
        role,
        password: pass,
      },
    }
  );
  return upt;
};

module.exports = User = mongoose.model("users", UserSchema, "users");
