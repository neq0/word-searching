const form = document.getElementsByTagName("form")[0];

form.addEventListener("submit", evt => evt.preventDefault());

const filter = document.getElementById("filter");
const filterWith = document.getElementById("with");
const filterError = document.querySelector("input#with+.error-list");
const resultsTitle = document.getElementById("results-title");
const results = document.getElementById("results");

filterWith.addEventListener("input", evt => {
	if(filterWith.validity.valid) {
		if(filterWith.classList.contains("error"))
			filterWith.classList.remove("error");
		filterError.textContent = "";

		if(filterWith.value.length > 0) // There's a filter to be searched
			ajaxSearch();
		else { // There's no error but filter specified
			resultsTitle.textContent = "Results will show below";
			results.textContent = "";
		}
	}
	else {
		if(!filterWith.classList.contains("error"))
			filterWith.classList.add("error");
		if(filterWith.validity.valueMissing)
			filterError.textContent = "Please enter a filter";
		else if(filterWith.validity.patternMismatch)
			filterError.textContent = "Only English letters are allowed (no spaces)";
		else if(filterWith.validity.tooLong)
			filterError.textContent = "The filter can have at most 30 letters";
		else
			filterError.textContent = filterWith.validationMessage;
	}
});

filter.addEventListener("input", evt => {
	if(filterWith.value.length > 0) // There's a filter to be searched
		ajaxSearch();
})

// Used for aborting ajax requests
let currentController = null;

function ajaxSearch() {
	// Abort previous fetch
	if(currentController)
		currentController.abort();

	resultsTitle.textContent = "Searching...";
	(async () => {
		let queryUrl = "/ajax/search?" + new URLSearchParams(new FormData(form)).toString();
		
		// Record the current AbortController so that
		// the current fetch can be aborted when a new fetch
		// takes place.
		currentController = new AbortController();
		let response = await fetch(queryUrl, {
			method: "GET",
			signal: currentController.signal,
		});

		if(!response.ok)
			throw new Error(response.body);
		
		let words = await response.json();
		// console.log(words);

		resultsTitle.textContent = "Results:";
		results.textContent = "";
		words.forEach((word, index) => {
			if(index > 0)
				results.textContent += ' ';
			results.textContent += word;
		});
	})()
		.catch(err => {
			if(err.name && err.name === "AbortError") {
				// Aborted, no error
				// console.log("Fetch aborted, ok");
			}
			else{
				console.error("An error occurred during the AJAX query:");
				console.error(err);
				resultsTitle.textContent = "Please try again";
			}
		})
	;
}