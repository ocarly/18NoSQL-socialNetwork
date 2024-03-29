const { Thoughts, Users } = require("../models");

const thoughtsController = {
    getAllThoughts(req, res) {
        Thoughts.find({})
            .populate({
                path: "reactions",
                select: "-__v",
            })
            .select("-__v")
            .sort({ _id: -1 })
            .then((dbThoughtData) => res.json(dbThoughtData))
            .catch((err) => {
                console.log(err);
                res.sendStatus(400);
            });
    },
    getThoughtById({ params }, res) {
        Thoughts.findOne({ _id: params.id })
            .populate({
                path: "reactions",
                select: "-__v",
            })
            .select("-__v")
            .then((dbThoughtData) => {
                if (!dbThoughtData) {
                    return res.status(404).json({ message: "No thought with this id!" });
                }
                res.json(dbThoughtData);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(400);
            });
    },
    createThought({ params, body }, res) {
        Thoughts.create(body)
            .then(({ _id }) => {
                return Users.findOneAndUpdate(
                    { _id: body.userId },
                    { $push: { thoughts: _id } },
                    { new: true }
                );
            })
            .then((dbUserData) => {
                console.log(dbUserData);
                if (!dbUserData) {
                    return res
                        .status(200)
                        .json({ message: "Thought created!!!" });
                }

                res.json({ message: "Thought successfully created!" });
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(400); });
    },

    updateThought({ params, body }, res) {
        Thoughts.findOneAndUpdate({ _id: params.id }, body, {
            new: true,
            runValidators: true,
        })
            .then((dbThoughtData) => {
                if (!dbThoughtData) {
                    res.status(404).json({ message: "No thought found with this id!" });
                    return;
                }
                res.json(dbThoughtData);
            })
            .catch((err) => res.json(err));
    },
    deleteThought({ params }, res) {
        Thoughts.findOneAndDelete({ _id: params.id })
            .then((dbThoughtData) => {
                if (!dbThoughtData) {
                    return res.status(404).json({ message: "No thought with this id!" });
                }

                // remove thought id from user's `thoughts` field
                return Users.findOneAndUpdate(
                    { thoughts: params.id },
                    { $pull: { thoughts: params.id } }, //$pull removes from an existing values that match a specified condition.
                    { new: true }
                );
            })
            .then((dbUserData) => {
                if (!dbUserData) {
                    return res
                        .status(202)
                        .json({ message: "Yay! Thought deleted." });
                }
                res.json({ message: "Thought successfully deleted!" });
            })
            .catch((err) => res.json(err));
    },
    createReaction({ params, body }, res) {
        Thoughts.findOneAndUpdate(
            { _id: params.thoughtId },
            { $addToSet: { reactions: body } },
            { new: true, runValidators: true }
        )
            .then((dbThoughtData) => {
                if (!dbThoughtData) {
                    res.status(404).json({ message: "No thought with this id" });
                    return;
                }
                res.json(dbThoughtData);
            })
            .catch((err) => res.json(err));
    },
    removeReaction({ params }, res) {
        Thoughts.findOneAndUpdate(
            { _id: params.thoughtId },
            { $pull: { reactions: { reactionId: params.reactionId } } },
            { new: true }
        )
            .then((dbThoughtData) => res.json(dbThoughtData))
            .catch((err) => res.json(err));
    },
};

module.exports = thoughtsController;
