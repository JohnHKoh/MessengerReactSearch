const MORE_EMOJIS_SELECTOR = "[aria-label='Show more emojis'][role='button']";
let emojiCache = {};

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
                    emojiCache = {};
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
    const scroller = $("[aria-label='Emoji picker']").parent().parent().parent();
    scroller.scrollTop(1);
    scroller.scrollTop(0);
    const base = parent.parent();
    const children = base.children();
    const detached = children.detach();
    const div = $("<div id='other-emojis'></div>");
    div.append(detached);
    base.append(div);
    const parentClone = parent.clone();
    parentClone.attr("id", "reaction-search-id");
    parentClone.empty();
    parentClone.append(
    `
    <div class="reaction-search-input-box">
        <input id="reaction-search-input" type="text" placeholder="Search" autocomplete="off" />
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
    const val = $(this).val().toLowerCase();
    const catSelect = $("[aria-label='Emoji category selector']");
    const otherEmojis = $("#other-emojis");
    if (val === "") {
        const t0 = performance.now();
        otherEmojis.css('display', '');
        const t1 = performance.now();
        console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);
        catSelect.show();
    }
    else {
        otherEmojis.css('display', 'none');
        catSelect.hide();
        let matches = EmojiSearch.getMatches(val);
        addEmojisToResult(matches);
    }
}

function initEmojiCache() {
    const emojis = $("#other-emojis").children(":not(:first)").find("[role='gridcell']");
    emojis.each((i, emoji) => {
        const emojiAlt = $(emoji).find("img").attr("alt");
        emojiCache[emojiAlt] = emoji;
    });
}

function addEmojisToResult(matches) {
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
        if (rowCount === 6) {
            rowNumber++;
            rowCount = 0;
        }
    });
}