const express = require("express")
const router = express.Router();
const { query, validationResult } = require("express-validator");
const createError = require("http-errors");

const Word = require("../models/Word");

router.get("/",
	query("filter")
		.optional()
		.isIn(["start", "end"])
		.withMessage("Search filter not understood. Please try again.")
	,
	query("with")
		.optional()
		.trim()
		.notEmpty()
		.withMessage("Filter string cannot be empty.")
		.bail()
		.isAlpha("en-US")
		.withMessage("Only English letters are allowed.")
		.isLength({
			max: 30,
		})
		.withMessage("Filter string should have at most 30 letters.")
	,
	(req, res, next) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) {
			return res.render("index", {
				query: req.query,
				errors: errors.array(),
			});
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
			// console.log(`pattern === ${pattern}`);
			Word.find()
				.where("value").regex(pattern)
				.limit(40)
				.exec()
				.then(docs => docs.map(doc => doc.value))
				.then(words => {
					return res.render("index", { words, query: req.query });
				})
				.catch(err => next(err));
			return;
		}
		else
			return res.render("index", {});
	},
);

module.exports = router;
