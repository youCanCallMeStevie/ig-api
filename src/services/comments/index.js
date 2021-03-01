//Initial set-up
const express = require("express");
const commentRoutes = express.Router();
const mongoose = require("mongoose");
const q2m = require("query-to-mongo");

//Model
const CommentModel = require("../../Models/Comment");

//Middlewares
const schemas = require("../../Lib/validation/validationSchema");
const validationMiddleware = require(
  "../../Lib/validation/validationMiddleware"
);
// const { isAuthorized } = require("../../middlewares/authorization");

//Error Handling
const ApiError = require("../../Lib/ApiError");

//post new comment
commentRoutes.post(
  "/",
  validationMiddleware(schemas.commentSchema),
  async (req, res, next) => {
    try {
      const user = req.user;
      console.log("comment post user", user);
      const newComment = new CommentModel(req.body);
      newComment.userId = user.id;
      const { _id } = await newComment.save();
      res.status(200).send({ id: _id });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

//retrieve all comments for a specific post
commentRoutes.get("/:postId", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await CommentModel.countDocuments(query.criteria);
    const comment = await CommentModel.find(
      query.criteria && { postId: req.params.postId },
      query.options.fields
    )
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit);
    res.status(200).send({ links: query.links("/comments", total), comment });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//owner to edit their own comment on a specific post
commentRoutes.put(
  "/:commentId",
  validationMiddleware(schemas.commentSchema),
  async (req, res, next) => {
    const { commentId } = req.params;
    const user = req.user;
    const commentToEdit = await CommentModel.findById(commentId);
    try {
  if (commentToEdit.userId != user.id)
      throw new ApiError(403, `Only the owner of this comment can edit`);
      const updatedComment = await CommentModel.findByIdAndUpdate(
        commentId,
        req.body,
        {
          runValidators: true,
          new: true,
        }
      );
      res.status(200).json({ data: updatedComment });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

//owner to delete their own comment on a specific post
commentRoutes.delete("/:commentId", async (req, res, next) => {
  const { commentId } = req.params;
  const user = req.user;

  try {
    const commentToDelete = await CommentModel.findById(commentId);
    if (commentToDelete.userId == user.id) {
      try {
        const comment = await CommentModel.findByIdAndDelete(comment);
        if (comment) {
          res.send(commentId);
        } else {
          throw new ApiError(404, `Comment not found`);
        }
      } catch {
        throw new ApiError(400, `Something went wrong`);
      }
    } else {
      throw new ApiError(403, `Only the owner of this comment can delete`);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = commentRoutes;