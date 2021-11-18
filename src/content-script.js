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

let emojiCache = {};

function addSearchBar(node) {
    const parent = $(node).find("[aria-label='Your Reactions']").parent();
    const scroller = parent.parent().parent().parent().parent().parent();
    scroller.scrollTop(1);
    scroller.scrollTop(0);
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
    $("#reaction-search-input").trigger("focus");
    $("#reaction-search-input").on("input", handleSearch);
}

let parentsMap = {};

function handleSearch(e) {
    if ($.isEmptyObject(emojiCache)) initEmojiCache();
    if ($("#insert-into-me")) {
        $("#insert-into-me").find("[role='gridcell']").each((i, el) => {
            const emoji = $(el).find("img").attr("alt");
            const parent = parentsMap[emoji];
            parent.append(el);
        });
        $("#insert-into-me").remove();
    }
    const val = $(this).val();
    const siblings = $("#reaction-search-id").siblings();
    const catSelect = $("[aria-label='Emoji category selector']");
    if (val === "") {
        siblings.show();
        catSelect.show();
    }
    else {
        siblings.hide();
        catSelect.hide();
        let matches = EmojiSearch.getMatches(val);
        addEmojisToResult(matches);
    }
}

function initEmojiCache() {
    const emojis = $("[aria-label='Emoji picker']").children(":first").children(":not(:first):not(:nth-child(2))").find("[role='gridcell']");
    emojis.each((i, emoji) => {
        const emojiAlt = $(emoji).find("img").attr("alt");
        emojiCache[emojiAlt] = emoji;
    });
}

function addEmojisToResult(matches) {
    var startTime = performance.now();
    $("#reaction-search-id").append(
        `
        <div>
            <div role="rowgroup">
                <div id="insert-into-me"></div>
            </div>
        </div>
        `
    );
    let rowNumber = 0;
    let rowCount = 0;
    let row;
    matches.forEach((match) => {
        let emojiCell = emojiCache[match];
        if (!emojiCell) return;
        if (rowCount === 0) {
            row = $(`<div role="row"></div>`)
            $("#insert-into-me").append(row);
        }
        parentsMap[match] = $(emojiCell).parent();
        row.append(emojiCell);
        rowCount++;
        console.log('added emoji ' + rowCount + ' on row ' + rowNumber);
        if (rowCount === 6) {
            rowNumber++;
            rowCount = 0;
        }
    });
    var endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
}