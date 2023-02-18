const router = require("express").Router();
const Conversation = require("../models/Conversation");

//new conv

router.post("/", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get conv of a user

router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get conv includes two userId

router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

function clearNotification(conversation, sender) {
  console.log(conversation[0].notifications.senderNotifications.userId)
  console.log("userId",sender)
  console.log(conversation[0].notifications.receiverNotifications.userId)
  if (conversation[0].notifications.senderNotifications.userId == sender) {
    return {
      senderNotifications: {
        count: 0,
        userId: conversation[0].notifications.senderNotifications.userId,
      },
      receiverNotifications: {
        count: conversation[0].notifications.receiverNotifications.count,
        userId: conversation[0].notifications.receiverNotifications.userId,
      },
    };
  } else {
    return {
      senderNotifications: {
        count: conversation[0].notifications.senderNotifications.count,
        userId: conversation[0].notifications.senderNotifications.userId,
      },
      receiverNotifications: {
        count: 0,
        userId: conversation[0].notifications.receiverNotifications.userId,
      },
    };
  }
}

// clear conversation message notification
router.post("/clearConversation", async (req, res) => {
  const { conversationId, userId } = req.body;
  try {
    const conversation = await Conversation.find({
      _id: conversationId,
    });
    const updatedNotification = clearNotification(conversation, userId);
    const updateConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          notifications: updatedNotification,
        },
      },
      { new: true }
    );
    console.log("updateConversation", updateConversation);
    res.status(200).json(updateConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
