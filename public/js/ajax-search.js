function turnOnClass(elem, className) {
	if(!elem.classList.contains(className))
		elem.classList.add(className);
}

function turnOffClass(elem, className) {
	if(elem.classList.contains(className))
		elem.classList.remove(className);
}

const form = document.getElementsByTagName("form")[0];

form.addEventListener("submit", evt => evt.preventDefault());

const filter = document.getElementById("filter");
const filterWith = document.getElementById("with");
const filterError = document.querySelector("input#with+.error-list");
const resultTitle = document.getElementById("result-title");
const resultContent = document.getElementById("result-content");
const loadMore = document.getElementById("load-more");

filterWith.addEventListener("input", evt => {
	if(filterWith.validity.valid) {
		turnOffClass(filterWith, "error");
		filterError.textContent = "";

		if(filterWith.value.length > 0) // There's a filter to be searched
			ajaxSearch();
		else { // There's no error but filter specified
			resultTitle.textContent = "Results will show here";
			resultContent.textContent = "";
		}
	}
	else {
		turnOnClass(filterWith, "error");
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
	if(filterWith.value.length > 0) { // There's a filter to be searched
		ajaxSearch();
	}
});

let loadMoreDisabled = false;

loadMore.addEventListener("click", evt => {
	if(!loadMoreDisabled) {
		ajaxSearch(true);
	}
})

// Used for aborting ajax requests
let currentController = null;
// Used for loading more words
let currentLastWord;

function ajaxSearch(loadingMore = false) {
	// Abort previous fetch
	if(currentController) {
		currentController.abort();
	}

	if(!loadingMore) {
		resultTitle.textContent = "Searching...";
	}
	else {
		loadMore.textContent = "Loading...";
		turnOnClass(loadMore, "loading");
		loadMoreDisabled = true;
	}
		
	(async () => {
		let formData = new FormData(form);
		if(loadingMore)
			formData.append("after", currentLastWord);
		
		let queryUrl = "/ajax/search?" + new URLSearchParams(formData).toString();
		// console.log("QUERY ->", queryUrl);
		
		// Record the current AbortController so that
		// the current fetch can be aborted when a new fetch
		// takes place.
		currentController = new AbortController();
		const response = await fetch(queryUrl, {
			method: "GET",
			signal: currentController.signal,
		});

		if(!response.ok)
			throw new Error(response.body);
		
		const result = await response.json();
		const words = result.words;

		if(words.length !== 0) {
			resultTitle.textContent = "Results:";
			if(!loadingMore) {
				// Remove all children first
				while(resultContent.firstChild) {
					resultContent.removeChild(resultContent.lastChild);
				}	
			}
			words.forEach(word => {
				const wordSpan = document.createElement("span");
				wordSpan.textContent = word;
				resultContent.append(wordSpan);
			});
		}
		else {
			resultTitle.textContent = "No words match the criteria";
			resultContent.textContent = "";
		}

		currentLastWord = words[words.length - 1];
		
		loadMoreDisabled = false;
		loadMore.textContent = "Load more";
		turnOffClass(loadMore, "loading");
		if(result.isThereMore) {
			turnOffClass(loadMore, "hidden");
		}
		else {
			turnOnClass(loadMore, "hidden");
		}
	
	})()
		.catch(err => {
			if(err.name && err.name === "AbortError") {
				// Aborted, no error
				// console.log("Fetch aborted, ok");
			}
			else{
				console.error("An error occurred during the AJAX query:");
				console.error(err);
				resultTitle.textContent = "Please try again";
			}
		})
	;
}