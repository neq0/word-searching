const express = require("express");
const router = express.Router();
const { query, validationResult } = require("express-validator");

const Word = require("../models/Word");

router.get("/search",
	query("filter")
		.isIn(["start", "end"])
		.withMessage("Search filter not understood.")
	,
	query("with")
		.trim()
		.notEmpty()
		.withMessage("Filter string cannot be empty.")
		.bail()
		.isAlpha("en-US")
		.withMessage("Only English letters are allowed (no spaces).")
		.toLowerCase()
		.isLength({
			max: 30,
		})
		.withMessage("The filter can have at most 30 letters.")
	,
	(req, res, next) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) {
			return res.status(400).json(errors.array());
		}

		let filter = req.query["filter"];
		if(filter) {
			let pattern;
			switch(filter) {
				case "start":
					pattern = "^" + req.query["with"];
					break;
				case "end":
					pattern = req.query["with"] + "$";
					break;
				default:
					return next(createError(400, "Unknown filter"));
			}
			Word.find()
				.where("value").regex(pattern)
				.limit(40)
				.exec()
				.then(docs => docs.map(doc => doc.value))
				.then(words => {
					return res.status(200).json(words);
				})
				.catch(next);
			return;
		}
	}
);

module.exports = router;