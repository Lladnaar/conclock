import {test, expect} from "@playwright/test";

test.describe("Index...", () => {
    test("...is visible", async ({page}) => {
        await page.goto("http://localhost:8080/");

        // check elements
        await expect(page.getByTestId("status.message-text")).toBeVisible();
        await expect(page.getByTestId("app.clock-link")).toBeVisible();
        await expect(page.getByTestId("app.timer-link")).toBeVisible();
        await expect(page.getByTestId("app.monitor-link")).toBeVisible();
        await expect(page.getByTestId("app.settings-link")).toBeVisible();
    });
});

test.describe("Errors...", () => {
    test("...when page not found", async ({page, request}) => {
        await page.goto("http://localhost:8080/missing.html");
        const response = await request.get("http://localhost:8080/missing.html");

        // check error
        expect(response.status()).toBe(404);
        await expect(page.getByRole("document")).toContainText("404");
        await expect(page.getByRole("document")).toContainText("not found");
    });
});
