import {test, expect} from "@playwright/test";

test("Check basic visability of clock", async ({page}) => {
    await page.goto("http://localhost:8080/");
    await page.getByRole("link", {name: "🕐"}).click();
    await expect(page.locator("#message")).toBeVisible();
    await expect(page.locator("#message")).toHaveText("Clock");
    await expect(page.locator("#clock")).toBeVisible();
    await expect(page.locator("#clock")).toHaveText(/\d+:\d+/);
});
