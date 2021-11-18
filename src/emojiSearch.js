let memory = {};

class EmojiSearch {
    static getMatches(query) {
        if (memory[query]) return memory[query];
        let oneCharLessMatches = memory[query.substring(0, query.length - 1)];
        if (query.length > 1 && oneCharLessMatches && oneCharLessMatches.length === 0) {
            memory[query] = [];
            return [];
        }
        let matches = [];
        Object.keys(emojiDict).forEach((key) => {
            if (key.includes(query)) {
                matches.push(emojiDict[key]);
            }
        });
        memory[query] = matches;
        return matches;
    }
}