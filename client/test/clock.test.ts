import {test, expect} from "@playwright/test";

test.describe("Clock...", () => {
    test("...is visible", async ({page}) => {
        await page.goto("http://localhost:8080/");
        
        // navigate to Clock
        await page.getByTestId("app.clock-link").click();
        await expect(page.getByTestId("status.message-text")).toBeVisible();
        await expect(page.getByTestId("timer.clock-text")).toBeVisible();
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+/);
    });
});

test.describe("Settings...", () => {
    test("...is accessible and dismissible by keyboard", async ({page}) => {
        await page.goto("http://localhost:8080/clock.html");
        
        // Settings appear
        await page.getByTestId("status.message-text").press("Escape");
        await expect(page.getByTestId("setting.size-select")).toBeVisible();
        await expect(page.getByTestId("setting.hour-select")).toBeVisible();
        await expect(page.getByTestId("setting.timezone-select")).toBeVisible();
        await expect(page.getByTestId("setting.close-button")).toBeVisible();
        
        // Settings disappear
        await page.keyboard.press("Escape");
        await expect(page.getByTestId("setting.size-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.hour-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.timezone-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.close-button")).not.toBeVisible();
    });

    test("...is accessible and dismissible by mouse", async ({page}) => {
        await page.goto("http://localhost:8080/clock.html");

        // Settings appear
        await page.mouse.down({button: "middle"});
        await expect(page.getByTestId("setting.size-select")).toBeVisible();
        await expect(page.getByTestId("setting.hour-select")).toBeVisible();
        await expect(page.getByTestId("setting.timezone-select")).toBeVisible();
        await expect(page.getByTestId("setting.close-button")).toBeVisible();

        // Settings disappear
        await page.getByTestId("setting.close-button").click();
        await expect(page.getByTestId("setting.size-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.hour-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.timezone-select")).not.toBeVisible();
        await expect(page.getByTestId("setting.close-button")).not.toBeVisible();
    });

    test("...style size applies to clock", async ({page}) => {
        await page.goto("http://localhost:8080/clock.html");
        await page.mouse.down({button: "middle"});
        await page.getByTestId("setting.hour-select").selectOption("false");

        // short time
        await page.getByTestId("setting.size-select").selectOption("short");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+/);
        // medium time
        await page.getByTestId("setting.size-select").selectOption("medium");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+:\d+/);
        // long time
        await page.getByTestId("setting.size-select").selectOption("long");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+:\d+ \w+(\+\d+)?/);
    });

    test("...style hour applies to clock", async ({page}) => {
        await page.goto("http://localhost:8080/clock.html");
        await page.mouse.down({button: "middle"});
        await page.getByTestId("setting.size-select").selectOption("short");

        // 12 hour
        await page.getByTestId("setting.hour-select").selectOption("true");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+ (am|pm|AM|PM)/);
        // 24 hour
        await page.getByTestId("setting.hour-select").selectOption("false");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+/);
    });

    test("...timezone applies to clock", async ({page}) => {
        await page.goto("http://localhost:8080/clock.html");
        await page.mouse.down({button: "middle"});
        await page.getByTestId("setting.size-select").selectOption("short");
        await page.getByTestId("setting.hour-select").selectOption("false");

        // Timezone A
        await page.getByTestId("setting.timezone-select").selectOption("Europe/London");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+/);
        const timeA = await page.getByTestId("timer.clock-text").textContent();
        // Timezone B
        await page.getByTestId("setting.timezone-select").selectOption("Pacific/Auckland");
        await expect(page.getByTestId("timer.clock-text")).toHaveText(/\d+:\d+/);
        await expect(page.getByTestId("timer.clock-text")).not.toContainText(timeA);
    });
});
