var API_KEY = "AIzaSyCr6xs0NlPg2hIynXQJWY3o230n6iQyDl0",
    NO_OF_RESULTS = 5; // Chrome shows only upto 5 results

var currentQueryString,
    latestDefault = null,
    resultCache = {};

chrome.omnibox.onInputChanged.addListener(_.debounce(function (queryText, suggestCallback) {
    console.log("Changed:", queryText);
    currentQueryString = queryText;

    function clearDefault (queryText) {
        latestDefault = null;
        var suggestion = queryText ?
            "Search MDN for: <match>" + queryText + "</match>":
            "Start typing to search MDN";
        chrome.omnibox.setDefaultSuggestion({description: suggestion});
    }

    function setDefaultSuggestion (result) {
        latestDefault = result;
        chrome.omnibox.setDefaultSuggestion({description: result.description});
    }

    function dataHandler (data) {
        resultCache[queryText] = data;

        if (currentQueryString !== queryText) { // We went past this query
            return;
        }

        if (!data.items) {
            chrome.omnibox.setDefaultSuggestion({description: "No results found for: <match>" + queryText + "</match>"});
            return;
        }

        var results = _(data.items).
            chain().
            first(NO_OF_RESULTS).
            map(function (item) {
                var description = "<url>" + item.htmlFormattedUrl + "</url><dim> - " + item.htmlTitle + "</dim>";
                description = description.replace(/<b>/gi, "<match>").replace(/<\/b>/gi, "</match>");
                return {
                    content    : item.link,
                    description: description
                };
            }).
            value();

        setDefaultSuggestion(results.shift());
        suggestCallback(results);
    }

    if (!queryText) {
        clearDefault(queryText);
        return;
    }

    // Check if we cached results for this query
    if (resultCache[queryText]) {
        dataHandler(resultCache[queryText]);
        return;
    } else {
        clearDefault(queryText);
    }

    $.getJSON("https://www.googleapis.com/customsearch/v1?callback=?",
        {
            key   : API_KEY,
            alt   : "json",
            q     : queryText,
            num   : NO_OF_RESULTS,
            lr    : "lang_en",
            cx    : "017146964052550031681:wnjobi1fzcm",
            fields: "items(formattedUrl,htmlFormattedUrl,htmlTitle,link,title)"
        },
        dataHandler);
}, 250));

chrome.omnibox.onInputEntered.addListener(function (queryText) {
    // Navigate user to selected page or the search page
    console.log("Entered:", queryText);

    var url;

    var isUrl = queryText.indexOf("http://") === 0 || queryText.indexOf("https://") === 0;

    if (isUrl) {
        url = queryText;
    } else if (queryText == currentQueryString && !!latestDefault) {
        url = latestDefault.content
    } else {
        url = "https://developer.mozilla.org/en-US/search?q=" + encodeURIComponent(queryText);
    }

    chrome.tabs.update({url: url});
});

chrome.omnibox.onInputStarted.addListener(function () {
    console.log("Started");
});

chrome.omnibox.onInputCancelled.addListener(function () {
    console.log("Cancelled");
});
