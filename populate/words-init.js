const mongoose = require("mongoose");
const Word = require("../models/Word");
const { readFile } = require("fs/promises");
const path = require("path");

console.log("In this script we will load some initial data into the database.");

const databaseUrl = "mongodb+srv://db-admin:aOILRji0vZThxjbN@testcluster.k25bh.mongodb.net/WordSearching?retryWrites=true&w=majority";

mongoose.connect(databaseUrl)
	.then(() => console.log("MongoDB connected!"))
	.catch(console.error);

readFile(path.join(__dirname, "words.txt"), { encoding: "utf-8" })
	.then(str => str.split("\r\n"))
	// .then(allWords => allWords.filter((word, index) => {
	// 	return index < 5000 && index % 50 === 1;
	// }))
	// .then(words => {
	// 	words.forEach(word => {
	// 		console.log(word, word.length);
	// 	})
	// })
	.then(words => {
		return Word.create(
			words.map(word => new Word({
				value: word,
			}))
		);
	})
	.then(docs => {
		console.log(`${docs.length} words have been saved.`);
	})
	.catch(console.error);