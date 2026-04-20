const { isValidMessage, sendChatMessage } = require("./chatbot");

/* tests for ai chatbot functionality*/

/* isValidMessage tests */

/*Tests that no input is rejected */
test("chatbot rejects input if the input is empty", () => {
    const result = isValidMessage("");
    expect(result).toBe(false);
});

/*Tests that a valid question is accepted*/
test("chatbot accepts a valid question", () => {
    const result = isValidMessage("How do i get a leap card?");
    expect(result).toBe(true);
});

/*Tests that a very long message will still be accepted*/
test("chatbot accepts a very long message with 5000 characters", () => {
    const largeMessage = "f".repeat(5000);
    const result = isValidMessage(largeMessage);
    expect(result).toBe(true);
});

/*Tests that the chatbot rejects messages with only white space*/
test("chatbot rejects inputs that only contain white space", () => {
    const result = isValidMessage("     ");
    expect(result).toBe(false);
});

/*Tests that the chatbot accepts a input with a single character*/
test("chatbot accepts a input that contains only a single character in the search bar", () => {
    const result = isValidMessage("f");
    expect(result).toBe(true);
});

/*Tests that the chatbot will respond if the input is a single emoji*/
test("chatbot accepts a input even if its only a single emoji", () => {
    const result = isValidMessage("😊");
    expect(result).toBe(true);
});

/*tests that the chatbot will reject a message that is just numbers*/
test("chatbot will reject a input that is just numbers", () => {
    const result = isValidMessage("12345");
    expect(result).toBe(false);
});

/* sendChatMessage tests with fetch mocked */

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

/*tests that the correct reply is fetched from the API reponse */
test("Returns correct reply on a sucsessful response", async () => {
    global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
            candidates: [{ content: { parts: [{ text: "Peak times are between 15:00 and 18:00." }] } }]
        })

    });
    const result = await sendChatMessage("When are peak hours?");
    expect(result).toBe("Peak times are between 15:00 and 18:00.");
});

/*tests that the API never recieves a invalid message */
test("blocks invalid message before calling the API", async () => {
    await expect(sendChatMessage("")).rejects.toThrow("Invalid message");
    expect(global.fetch).not.toHaveBeenCalled();
});

/*tests that a invalid API key error is seen and properly handled */
test("API is thrown when it returns a 403 error", async () => {
    global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({})
    });
    await expect(sendChatMessage("how do i get a leap card?")).rejects.toThrow("API error: 403");
});
