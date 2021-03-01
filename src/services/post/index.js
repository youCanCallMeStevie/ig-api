const router = require("express").Router()
const postModel = require("./schema")
const upload = require("../../Lib/cloudinary/posts")

router.get("/", async (req, res, next) => {
	//gets all posts
	try {
		const posts = await postModel.find().sort({ createdAt: -1 }) //how to add pagination to posts?
		if (posts.length > 0) {
			res.status(200).send(posts)
		} else res.send(204) //no content
	} catch (e) {
		next(e)
	}
})

router.get("/:userId", async (req, res, next) => {
	//gets posts from single user (user feed)
	try {
		//const check_user = await userModel.findById(req.params.userId)
		//if (check_user) {
			//if a user is found, search for their feed
			const user_feed = await postModel
				.find({ authorId: req.params.userId })
				.sort({ createdAt: -1 })
			if (user_feed.length > 0) { //if there are posts
				res.status(200).send(user_feed) 
			} else res.send(204) //if there are no posts
		//} else res.send(404) //if there is no user
	} catch (e) {
		next(e)
	}
})

router.post("/upload", upload.single("post"), async (req, res, next) => {
	try {
		const new_post = new postModel({
			...req.body,
			image: req.file.path,
		})
		const { _id } = await new_post.save()
		res.status(200).send(`Resource created with id ${_id}`)
	} catch (e) {
		next(e)
	}
})

router.put("/:postId", async (req, res, next) => {
	try {
		const edited_post = await postModel.findByIdAndUpdate(
			req.params.postId,
			req.body,
			{ runValidators: true }
		)
		if (edited_post) {
			res.status(200).send("Updated succesfully!")
		}
	} catch (e) {
		next(e)
	}
})

router.delete("/:postId", async (req, res, next) => {
	try {
		const delete_post = await postModel.findByIdAndDelete(req.params.postId)
		if (delete_post) {
			res.status(200).send("Deleted")
		}
	} catch (e) {
		next(e)
	}
})
module.exports = router
