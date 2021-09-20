const express = require("express");
const router = express.Router();
const { query, validationResult } = require("express-validator");

const Word = require("../models/Word");

const wordsPerQuery = 36;

router.get("/search",
	query("filter")
		.toArray()
	,
	query("with")
		.toArray()
		.customSanitizer(arr =>
			arr.map(str =>
				str.toLowerCase()
			)
		)
	,
	query("after")
		.trim()
		.optional()
	,
	(req, res, next) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) {
			return res.status(400).json(errors.array());
		}

		let filters = req.query["filter"];
		let filterWiths = req.query["with"];
		let patterns = [];

		filters.forEach((filter, index) => {
			if(filterWiths[index] === "") {
				return;
			}
			
			let pattern;
			switch(filter) {
				case "start":
					pattern = "^" + filterWiths[index];
					break;
				case "end":
					pattern = filterWiths[index] + "$";
					break;
				case "inc":
					pattern = filterWiths[index];
					break;
				default:
					// Log and ignore invalid filters
					console.log("Received invalid filter:", filter);
					return;
			}
			patterns.push(pattern);
		});

		let queryObj = {
			$and: [],
		};

		if(req.query["after"]) {
			queryObj.$and.push({
				value: {
					$gt: req.query["after"],
				},
			});
		}

		patterns.forEach(pattern => {
			queryObj.$and.push({
				value: {
					$regex: pattern,
				},
			});
		});

		Word.find(queryObj)
			.sort({ value: 1 })
			.limit(wordsPerQuery + 1)
			.exec()
			.then(docs => docs.map(doc => doc.value))
			.then(words => {
				let isThereMore = false;
				if(words.length === wordsPerQuery + 1) {
					isThereMore = true;
					words.pop();
				}
				return res.status(200).json({
					words,
					isThereMore,
				});
			})
			.catch(next)
		;
	}
);

module.exports = router;