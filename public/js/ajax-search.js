const options = [
	{
		value: "start",
		text: "start with",
	},
	{
		value: "end",
		text: "end with",
	},
];

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

const resultTitle = document.getElementById("result-title");
const resultContent = document.getElementById("result-content");
const loadMore = document.getElementById("load-more");

const filterList = document.getElementById("filter-list");

function createFilter() {
	const filter = document.createElement("select");
	filter.setAttribute("name", "filter");
	options.forEach(option => {
		const optionElem = document.createElement("option");
		optionElem.setAttribute("value", option.value);
		optionElem.textContent = option.text;
		filter.appendChild(optionElem);
	});
	filter.addEventListener("input", filtersUpdated);

	const div = document.createElement("div");
	div.appendChild(filter);
	return div;
}

function createFilterWith() {
	const filterWith = document.createElement("input");
	filterWith.setAttribute("type", "text");
	filterWith.setAttribute("name", "with");
	filterWith.setAttribute("pattern", "^[A-Za-z]+$");
	filterWith.setAttribute("maxlength", "30");
	filterWith.setAttribute("autocomplete", "off");

	const errorList = document.createElement("p");
	errorList.classList.add("error-list");

	filterWith.addEventListener("input", evt => {
		if(filterWith.validity.valid) {
			turnOffClass(filterWith, "error");
			errorList.textContent = "";

			filtersUpdated();
		}
		else {
			turnOnClass(filterWith, "error");
			if(filterWith.validity.patternMismatch)
				errorList.textContent = "Only English letters are allowed (no spaces)";
			else if(filterWith.validity.tooLong)
				errorList.textContent = "The filter can have at most 30 letters";
			else
				errorList.textContent = filterWith.validationMessage;
		}
	});

	const div = document.createElement("div");
	div.appendChild(filterWith);
	div.appendChild(errorList);
	return div;
}

function createAndBtn() {
	const andBtn = document.createElement("button");
	andBtn.setAttribute("type", "button");
	andBtn.classList.add("and");
	const span = document.createElement("span");
	span.textContent = "and";
	andBtn.appendChild(span);

	andBtn.addEventListener("click", evt => {
		let li = andBtn.parentNode.parentNode;
		if(li === filterList.lastChild) {
			// the last `and` button in the list:
			// create a new filter
			filterList.appendChild(createFilterTrio());
		}
		// if not the last `and` button in the list,
		// do nothing.
		andBtn.blur();
	});

	const div = document.createElement("div");
	div.appendChild(andBtn);
	return div;
}

function createFilterTrio() {
	const li = document.createElement("li");
	li.appendChild(createFilter());
	li.appendChild(createFilterWith());
	li.appendChild(createAndBtn());
	return li;
}

const clear = document.getElementById("clear");

clear.addEventListener("click", evt => {
	while(filterList.childElementCount > 1) {
		const last = filterList.lastChild;
		filterList.removeChild(last);
	}
	
	let input = filterList.querySelector("input");
	input.value = "";
	input.dispatchEvent(new Event("input"));
});

function filtersUpdated() {
	// A search can only be performed if no errors
	let allWithsValid = true;
	// A search can only be performed if at least
	// one `FilterWith` field is non-empty
	let queryNotEmpty = false;
	for(const input of document.querySelectorAll("input[type=text]")) {
		if(!input.validity.valid) {
			allWithsValid = false;
			break;
		}
		if(input.value.length > 0) {
			queryNotEmpty = true;
		}
	}

	if(allWithsValid) {
		if(queryNotEmpty) {
			ajaxSearch();
		}
		else {
			resultTitle.textContent = "Results will show here";
			resultContent.textContent = "";
			turnOnClass(loadMore, "hidden");
		}
	}
}

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
		console.log("QUERY ->", queryUrl);
		
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

filterList.appendChild(createFilterTrio());