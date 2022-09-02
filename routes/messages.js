const router = require("express").Router();
const Message = require("../models/Message");

//Add
router.post("/", async (req, res) => {
    const newMessage = new Message(req.body);

    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Get
router.get("/:conversationId", async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Delete
router.put("/:conversationId/:userId", async (req, res) => {
    try {
        const message = await Message.findById(req.params.conversationId);
        if (message.sender === req.params.userId) {
            await message.updateOne({ $set: req.body });
            res.status(200).json("Message Deleted");
        } else {
            res.status(403).json("Message can only be deleted by it's owner only")
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
