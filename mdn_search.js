var API_KEY = "AIzaSyCr6xs0NlPg2hIynXQJWY3o230n6iQyDl0",
    NO_OF_RESULTS = 5; // Chrome shows only upto 5 results

var currentQueryString;
var resultCache = {};

chrome.omnibox.onInputChanged.addListener(_.debounce(function (queryText, suggestCallback) {
    console.log("Changed:", queryText);
    currentQueryString = queryText;

    if (!queryText) return;

    function dataHandler (data) {
        if (currentQueryString !== queryText) {
            // We went past this query, but cache it anyway
            resultCache[queryText] = data;
            return;
        }

        _(data.items).
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
            tap(suggestCallback);
    }

    // Check if we cached results for this query
    if (resultCache[queryText]) {
        dataHandler(resultCache[queryText]);
        return;
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

    if (queryText.indexOf("http://") === -1 && queryText.indexOf("https://") === -1) {
        url = "https://developer.mozilla.org/en-US/search?q=" + encodeURIComponent(queryText);
    } else {
        url = queryText;
    }

    chrome.tabs.update({url: url});
});

chrome.omnibox.onInputStarted.addListener(function () {
    console.log("Started");
});

chrome.omnibox.onInputCancelled.addListener(function () {
    currentQueryString = "";
    console.log("Cancelled");
});
