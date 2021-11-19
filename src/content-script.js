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

let scroller;

async function addSearchBar(node) {
    const parent = $(node).find("[aria-label='Your Reactions']").parent();
    scroller = $("[aria-label='Emoji picker']").parent().parent().parent();
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
        <div id="input_container">
            <input class="loading-search" id="reaction-search-input" type="text" placeholder="Loading..." autocomplete="off" disabled />
            <img src="https://cdn-icons.flaticon.com/png/512/3031/premium/3031293.png?token=exp=1637289701~hmac=a5d5f296a984c3631bb5fb31516d6618" id="input_img">
        </div>
    </div>
    `);
    base.prepend(parentClone);
    if ($.isEmptyObject(emojiCache)) await initEmojiCache();
    $("#reaction-search-input").attr("disabled", false);
    $("#reaction-search-input").attr("placeholder", "Search");
    $("#reaction-search-input").removeClass("loading-search");
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
    const otherEmojis = $("#other-emojis").children();
    if (val === "") {
        //const t0 = performance.now();
        otherEmojis.filter(":first, :nth-child(2)").css('display', '');
        const displayOtherEmojis = function() {
            otherEmojis.css('display', '');
        }
        scroller.one("scroll", displayOtherEmojis);
        catSelect.one("click", displayOtherEmojis);
        //const t1 = performance.now();
        //console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);
        catSelect.show();
    }
    else {
        scroller.off("scroll");
        catSelect.off("click");
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
        while (i < 100) {
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
    let overflow = [];
    const MAX_ROWS = 9;
    let row;
    for (let match of matches) {
        let emojiCell = emojiCache[match];
        if (!emojiCell) continue;
        if (rowCount === 0) {
            row = $(`<div id="search-row-${rowNumber}" style="height: 38px" role="row"></div>`)
            $("#insert-into-me").append(row);
        }
        if (rowNumber < MAX_ROWS) {
            parentsMap[match] = $(emojiCell).parent();
            row.append(emojiCell);
        }
        else {
            overflow.push([match, emojiCell]);
        }
        rowCount++;
        if (rowCount === 6) {
            rowNumber++;
            rowCount = 0;
        }
    }
    if (overflow.length > 0) {
        scroller.one("scroll", function() {
            for (let i = 0; i < overflow.length; i++) {
                const rowIndex = Math.floor(i / 6) + MAX_ROWS;
                const [match, emojiCell] = overflow[i];
                parentsMap[match] = $(emojiCell).parent();
                $(`#search-row-${rowIndex}`).append(emojiCell);
            }
        })
    }
}