const { Schema, model } = require("mongoose");

const wordSchema = new Schema({
	value: {
		type: String,
		required: true,
		minLength: 1,
		maxLength: [30, "Non-contrived, non-technical English words in common usage should be no more than 30 letters, got {VALUE}"],
	},
});

module.exports = model("Word", wordSchema);