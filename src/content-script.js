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
    $("#reaction-search-input").focus();
    $("#reaction-search-input").on("input", handleSearch);
}

let parentsMap = {};

function handleSearch(e) {
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
                <div id="insert-into-me"></div>
            </div>
        </div>
        `)
        let matches = EmojiSearch.getMatches(val);
        let index = 0;
        matches.forEach((match) => {
            let emojiCell = emojis.find(`[alt='${match}']`).closest("[role='gridcell']");
            if (emojiCell.length === 0) return;
            let rowNumber = Math.floor(index/6);
            let rowId = `search-row-${rowNumber}`;
            let rowIdSelector = "#" + rowId;
            if (index % 6 === 0) {
                $("#insert-into-me").append(`
                <div id="${rowId}" role="row">
                </div>
            `)
            }
            parentsMap[match] = emojiCell.parent();
            $(rowIdSelector).append(emojiCell);
            index++;
        });
    }
}