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

async function addSearchBar(node) {
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
        <input id="reaction-search-input" type="text" placeholder="Search" autocomplete="off" disabled />
    </div>
    `);
    base.prepend(parentClone);
    if ($.isEmptyObject(emojiCache)) await initEmojiCache();
    $("#reaction-search-input").attr("disabled", false);
    $("#reaction-search-input").trigger("focus");
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
    const val = $(this).val().toLowerCase();
    const catSelect = $("[aria-label='Emoji category selector']");
    const otherEmojis = $("#other-emojis");
    if (val === "") {
        //const t0 = performance.now();
        otherEmojis.css('display', '');
        //const t1 = performance.now();
        //console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);
        catSelect.show();
    }
    else {
        otherEmojis.css('display', 'none');
        catSelect.hide();
        let matches = EmojiSearch.getMatches(val);
        addEmojisToResult(matches);
    }
}

async function initEmojiCache() {
    let emojis = await retrieveEmojis();
    emojis.each((i, emoji) => {
        const emojiAlt = $(emoji).find("img").attr("alt");
        emojiCache[emojiAlt] = emoji;
    });
}

function retrieveEmojis() {
    let emojis = $("#other-emojis").children(":not(:first)").find("[role='gridcell']");
    return new Promise(resolve => {
        let i = 0;
        while (i < 30) {
            (function(i) {
                setTimeout(function() {
                    if (emojis.length > 0) {
                        resolve(emojis);
                    }
                    else {
                        emojis = $("#other-emojis").children(":not(:first)").find("[role='gridcell']");
                    }
                }, 100 * i)
            })(i++)
        }
    })

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