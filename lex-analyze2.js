const fs = require("fs");
const mChar = ["{", "}", "+", "-", ";"];
const mLex = ["\r", "\n"];
class Lexer {
    constructor(filename) {
        this.filename = filename;
        this.currentLexeme = "";
        this.currentState = "start";
        this.errors = [];
        this.currentScope = 0; // Начальный уровень области определения
        this.identifierTable = {}; // Таблица идентификаторов
    }

    analyze() {
        const input = fs.readFileSync(this.filename, "utf-8");
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            switch (this.currentState) {
                case "start":
                    if (/\d/.test(char)) {
                        this.currentState = "number";
                        this.currentLexeme += char;
                    } else if (/[a-zA-Z]/.test(char)) {
                        this.currentState = "identifier";
                        this.currentLexeme += char;
                    } else if (char === "<") {
                        this.currentState = "lessThan";
                        this.currentLexeme += char;
                    } else if (char === ">") {
                        this.currentState = "greaterThan";
                        this.currentLexeme += char;
                    } else if (char === ":") {
                        this.currentState = "assign";
                        this.currentLexeme += char;
                    } else if (char === " ") {
                        // Ignore whitespace
                    } else if (char === "(" || char === ")") {
                        this.currentState = "lexem";
                        this.currentLexeme = char;
                        i--;
                    } else if (char === "{") {
                        // Открытие нового уровня области определения
                        this.currentScope++;
                        this.currentState = "start";
                        console.log(`Open scope at position ${i}`);
                    } else if (char === "}") {
                        // Закрытие текущего уровня области определения
                        if (this.currentScope > 0) {
                            this.currentScope--;
                            this.currentState = "start";
                            console.log(`Close scope at position ${i}`);
                        } else {
                            this.errors.push(`Unexpected '}' at position ${i}`);
                        }
                    } else if (!mChar.includes(char) && !mLex.includes(char)) {
                        this.errors.push(
                            `Unexpected lexeme '${char}' at position ${i}`
                        );
                    }
                    break;

                case "number":
                    if (/[\dabcdefABCDEF]/.test(char)) {
                        this.currentLexeme += char;
                    } else if (/;/.test(char)) {
                        this.currentState = "start";
                        console.log(`Number: ${this.currentLexeme}`);
                        this.currentLexeme = "";
                        i--;
                    } else if (
                        !/[\dabcdefABCDEF]/.test(char) &&
                        !/;/.test(char) &&
                        !mLex.includes(char)
                    ) {
                        this.errors.push(
                            `Unexpected lexeme '${this.currentLexeme}${char}'`
                        );
                        this.currentLexeme = "";
                        this.currentState = "start";
                        i--;
                    }
                    break;
                case "identifier":
                    if (/[a-zA-Z0-9]/.test(char)) {
                        this.currentLexeme += char;
                    } else {
                        this.currentState = "start";
                        const identifier = this.currentLexeme;
                        const scope = this.currentScope;
                        console.log(
                            `Identifier: ${identifier} (Scope: ${scope})`
                        ); // Вывод уровня области определения
                        this.addIdentifier(identifier, scope);
                        this.currentLexeme = "";
                        i--;
                    }
                    break;

                case "lexem":
                    this.currentState = "start";
                    console.log(`Operator: ${this.currentLexeme}`);
                    this.currentLexeme = "";
                    break;
                case "lessThan":
                    if (char === "=") {
                        this.currentState = "lessThanOrEqual";
                        this.currentLexeme += char;
                    } else {
                        this.currentState = "start";
                        console.log(`Less than: ${this.currentLexeme}`);
                        this.currentLexeme = "";
                        i--;
                    }
                    break;
                case "greaterThan":
                    if (char === "=") {
                        this.currentState = "greaterThanOrEqual";
                        this.currentLexeme += char;
                    } else {
                        this.currentState = "start";
                        console.log(`Greater than: ${this.currentLexeme}`);
                        this.currentLexeme = "";
                        i--;
                    }
                    break;
                case "assign":
                    if (char === "=") {
                        this.currentState = "equals";
                        this.currentLexeme += char;
                    } else {
                        this.errors.push(
                            `Expected '=' after ':' at position ${i}`
                        );
                        this.currentState = "start";
                        this.currentLexeme = "";
                        i--;
                    }
                    break;
                case "equals":
                    this.currentState = "start";
                    console.log(`Assignment: ${this.currentLexeme}`);
                    this.currentLexeme = "";
                    i--;
                    break;
                case "lessThanOrEqual":
                    this.currentState = "start";
                    console.log(`Less than or equal: ${this.currentLexeme}`);
                    this.currentLexeme = "";
                    i--;
                    break;
                case "greaterThanOrEqual":
                    this.currentState = "start";
                    console.log(`Greater than or equal: ${this.currentLexeme}`);
                    this.currentLexeme = "";
                    i--;
                    break;
                default:
                    this.errors.push(
                        `Unexpected state '${this.currentState}' at position ${i}`
                    );
                    this.currentState = "start";
                    this.currentLexeme = "";
                    i--;
                    break;
            }
        }

        if (this.currentLexeme !== "") {
            this.errors.push(
                `Unexpected end of input at position ${input.length}`
            );
        }

        if (this.errors.length > 0) {
            console.error("Errors:");
            console.error(this.errors.join("\n"));
        }
    }
    addIdentifier(identifier, scope) {
        const hash = this.hashFunction(identifier);
        const entry = { identifier, scope };

        if (!this.identifierTable.hasOwnProperty(hash)) {
            this.identifierTable[hash] = [entry]; // Прямая адресация
        } else {
            // Решение коллизии методом цепочек
            const chain = this.identifierTable[hash];
            chain.push(entry);
        }
    }

    hashFunction(identifier) {
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
            hash += identifier.charCodeAt(i);
        }
        return hash;
    }
}

const lexer = new Lexer("input.txt");
lexer.analyze();
console.log("Identifier Table:");
console.log(lexer.identifierTable);
