const router = require("express").Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/user");

//add
function updateNotification(conversation, sender) {
  if (conversation[0].notifications.senderNotifications.userId == sender) {
    return {
      senderNotifications: {
        count: conversation[0].notifications.senderNotifications.count,
        userId: conversation[0].notifications.senderNotifications.userId,
      },
      receiverNotifications: {
        count: conversation[0].notifications.receiverNotifications.count + 1,
        userId: conversation[0].notifications.receiverNotifications.userId,
      },
    };
  } else {
    return {
      senderNotifications: {
        count: conversation[0].notifications.senderNotifications.count + 1,
        userId: conversation[0].notifications.senderNotifications.userId,
      },
      receiverNotifications: {
        count: conversation[0].notifications.receiverNotifications.count,
        userId: conversation[0].notifications.receiverNotifications.userId,
      },
    };
  }
}

router.post("/", async (req, res) => {
  const { conversationId, sender, text } = req.body;
  const newMessage = new Message(req.body);

  try {
    const conversation = await Conversation.find({
      _id: conversationId,
    });
    const savedMessage = await newMessage.save();
    const updatedNotification = updateNotification(conversation, sender);
    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          recentMessage: {
            conversationId,
            sender,
            text,
            messageCreatedAt: savedMessage.createdAt,
          },
          notifications: updatedNotification,
        },
      }
    );
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/contact_us_message", async (req, res) => {
  const { _id, name, email, message } = req.body;
  const adminId = await User.getAdminId();
  console.log("adminId", adminId);
  try {
    const conversations = await Conversation.find({
      members: { $in: [_id] },
    });
    if (conversations.length > 0) {
      console.log("if", conversations.length);
      const newMessage = new Message({
        conversationId: conversations[0]._id,
        sender: _id,
        text: message,
      });
      const savedMessage = await newMessage.save();
      const updatedNotification = updateNotification(conversations, _id);
      await Conversation.updateOne(
        { _id: conversations[0]._id },
        {
          $set: {
            recentMessage: {
              conversationId: conversations[0]._id,
              sender: _id,
              text: message,
              messageCreatedAt: savedMessage.createdAt,
            },
            notifications: updatedNotification,
          },
        }
      );
      res.status(200).json({ done: true });
    } else {
      console.log("else");
      const newConversation = new Conversation({
        members: [adminId, _id],
      });
      const savedConversation = await newConversation.save();
      await Conversation.updateOne(
        { _id: savedConversation._id },
        {
          $set: {
            recentMessage: {
              conversationId: savedConversation._id,
              sender: _id,
              text: message,
            },
            notifications: {
              senderNotifications: {
                count: 0,
                userId: _id,
              },
              receiverNotifications: {
                count: 1,
                userId: adminId,
              },
            },
          },
        }
      );
      let arangeMessage = {
        conversationId: savedConversation._id,
        sender: _id,
        text: message,
      };
      const newMessage = new Message(arangeMessage);
      const savedMessage = await newMessage.save();
      res.status(200).json({ done: true });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/new_conversation", async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const newConversation = new Conversation({
    members: [senderId, receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    let arangeMessage = {
      conversationId: savedConversation._id,
      sender: senderId,
      text,
    };
    const newMessage = new Message(arangeMessage);
    const savedMessage = await newMessage.save();
    await Conversation.updateOne(
      { _id: savedConversation._id },
      {
        $set: {
          recentMessage: {
            conversationId: savedConversation._id,
            sender: senderId,
            text,
            messageCreatedAt: savedMessage.createdAt,
          },
          notifications: {
            senderNotifications: {
              count: 0,
              userId: senderId,
            },
            receiverNotifications: {
              count: 1,
              userId: receiverId,
            },
          },
        },
      }
    );
    const conversation = await Conversation.findOne({
      _id: savedConversation._id,
    });
    res.status(200).json({ message: savedMessage, conversation: conversation });
  } catch (err) {
    res.status(500).json(err);
  }
});

//get

router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
