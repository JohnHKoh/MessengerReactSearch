const MORE_EMOJIS_SELECTOR = "[aria-label='Show more emojis'][role='button']";

$(function () {
    $("body").on("click", MORE_EMOJIS_SELECTOR, function() {
        waitForEmojiSelector(emojiObserver)
    });
});

function waitForEmojiSelector(callback) {
    const config = { childList: true, subtree: true };
    const observer = new MutationObserver(callback);
    observer.observe(document, config);
}

function emojiObserver(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            Array.from(mutation.addedNodes).find(node => {
                if (node.tagName === "DIV" && node.getAttribute("role") === "dialog") {
                    observer.disconnect();
                    addSearchBar(node);
                    return true;
                }
                return false;
            });
        }
    }
}

function addSearchBar(node) {
    const parent = $(node).find("[aria-label='Your Reactions']").parent();
    const base = parent.parent();
    const parentClone = parent.clone();
    parentClone.attr("id", "reaction-search-id");
    parentClone.empty();
    parentClone.append(
    `
    <div class="reaction-search-input-box">
        <input id="reaction-search-input" type="text" placeholder="Search" />
    </div>
    `);
    base.prepend(parentClone);
    $("#reaction-search-input").on("input", handleSearch);
}

function handleSearch(e) {
    if ($("#insert-into-me")) {
        $("#insert-into-me").empty();
    }
    const val = $(this).val();
    const siblings = $("#reaction-search-id").siblings();
    const catSelect = $("[aria-label='Emoji category selector']");
    const emojis = $("[aria-label='Emoji picker']").children(":first").children(":not(:first):not(:nth-child(2))").find("[role='gridcell']");
    if (val === "") {
        siblings.show();
        catSelect.show();
    }
    else {
        siblings.hide();
        catSelect.hide();
        $("#reaction-search-id").append(
        `
        <div>
            <div role="rowgroup">
                <div>
                    <div id="insert-into-me" role="row">
                    </div>
                </div>
            </div>
        </div>
        `)
        let matches = emojiSearch(val);
        console.log(matches);
        matches.forEach((match) => {
            let emojiCell = emojis.find(`[alt='${match}']`).closest("[role='gridcell']");
            $("#insert-into-me").append($(emojiCell[0]).clone());
        });
    }
}

function emojiSearch(query) {
    const emojiDict = {
        "grinning face": "😀",
        "smiling face with 3 hearts": "🥰"
    }
    let matches = [];
    Object.keys(emojiDict).forEach((key) => {
        if (key.startsWith(query)) {
            matches.push(emojiDict[key]);
        }
    });
    return matches;
}