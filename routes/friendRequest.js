const router = require("express").Router();
const FR = require("../models/FriendRequest");

//Add
router.post("/", async (req, res) => {
    const newFR = new FR(req.body);

    try {
        const savedFR = await newFR.save();
        res.status(200).json(savedFR);
    } catch (err) {
        res.status(500).json(err);
    }
});

//Get
router.get("/:receiverId", async (req, res) => {
    try {
        const newFR = await FR.find({
            receiverId: req.params.receiverId
        });
        res.status(200).json(newFR);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
