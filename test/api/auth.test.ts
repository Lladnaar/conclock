import {test, expect} from "@playwright/test";
import {StatusCodes as http} from "http-status-codes";

function url(url: string) { return new URL(url, "http://localhost:8080/").href; }
let userUrl: string;
let loginUrl: string;

test.beforeAll(async ({request}) => {
    const response = await request.get(url("api"));
    const body = await response.json();
    userUrl = url(body.user.url);
    loginUrl = url(body.login.url);
});

test.describe("Basic authentication...", () => {
    test.describe.configure({mode: "serial"});

    const userData = {
        name: "Basic Auth User",
        username: "basic@auth.user",
    };
    type User = {id: string; url: string; name: string; username: string; password: {url: string}};
    let user: User;
    const password1 = "correcthorsebatterystaple";
    const password2 = "rightponycapacitornail";

    test("...user created without password", async ({request}) => {
        const response = await request.post(userUrl, {data: userData});
        expect(response.status()).toBe(http.CREATED);

        const body = await response.json();
        expect(body).toHaveProperty("id");
        expect(body).toHaveProperty("url");
        expect(body).toHaveProperty("name", userData.name);
        expect(body).toHaveProperty("username", userData.username);
        expect(body).toHaveProperty("password");
        expect(body.password).toHaveProperty("url");

        user = body;
    });

    test("...login fails before password set", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: password1, send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...password set", async ({request}) => {
        const passwordUrl = url(user.password.url);
        const response = await request.post(passwordUrl, {data: {password: password1}});
        expect(response.status()).toBe(http.OK);
    });

    test("...login succeeds with password", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: password1, send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.OK);
        expect(await context.cookies()).toEqual(expect.arrayContaining([expect.objectContaining({name: "Session-Token"})]));
    });

    test("...password changed", async ({request}) => {
        const passwordUrl = url(user.password.url);
        const response = await request.post(passwordUrl, {data: {password: password2}});
        expect(response.status()).toBe(http.OK);
    });

    test("...login succeeds with new password", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: password2, send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.OK);
        expect(await context.cookies()).toEqual(expect.arrayContaining([expect.objectContaining({name: "Session-Token"})]));
    });

    test("...login fails with old password", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: password1, send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...token revoked", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: password2, send: "always"}});
        const response = await context.request.delete(url(loginUrl));
        expect(response.status()).toBe(http.NO_CONTENT);
    });

    test("...user deleted", async ({request}) => {
        const response = await request.delete(url(user.url!));
        expect(response.status()).toBe(http.NO_CONTENT);
    });
});

test.describe("Mixed authentication...", () => {
    test.describe.configure({mode: "serial"});

    const user = {
        id: "",
        url: "",
        name: "Mixed Auth User",
        username: "mixed@auth.user",
        password: "correcthorsebatterystaple",
    };
    let apiToken: string;

    test("...user created", async ({request}) => {
        const response = await request.post(userUrl, {data: user});
        expect(response.status()).toBe(http.CREATED);

        const body = await response.json();
        user.url = body.url;
    });

    test("...succeeds with correct basic auth", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: user.password, send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toHaveProperty("sessionToken");
        apiToken = body.sessionToken;
    });

    test("...fails with wrong basic auth", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: "password", send: "always"}});
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...succeeds with correct cookie token", async ({context}) => {
        await context.addCookies([{name: "Session-Token", value: apiToken, domain: "localhost", path: "/"}]);
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.OK);
    });

    test("...fails with wrong cookie token", async ({context}) => {
        await context.addCookies([{name: "Session-Token", value: "invalid", domain: "localhost", path: "/"}]);
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...succeeds with correct bearer token", async ({request}) => {
        const response = await request.post(loginUrl, {headers: {Authorization: `Bearer ${apiToken}`}});
        expect(response.status()).toBe(http.OK);
    });

    test("...fails with incorrect bearer token", async ({request}) => {
        const response = await request.post(loginUrl, {headers: {Authorization: "Bearer invalid"}});
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...token revoked", async ({browser}) => {
        const context = await browser.newContext({httpCredentials: {username: user.username, password: user.password, send: "always"}});
        const response = await context.request.delete(url(loginUrl));
        expect(response.status()).toBe(http.NO_CONTENT);
    });

    test("...fails with revoked cookie token", async ({context}) => {
        await context.addCookies([{name: "Session-Token", value: apiToken, domain: "localhost", path: "/"}]);
        const response = await context.request.post(loginUrl);
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...fails with revoked bearer token", async ({request}) => {
        const response = await request.post(loginUrl, {headers: {Authorization: `Bearer ${apiToken}`}});
        expect(response.status()).toBe(http.UNAUTHORIZED);
    });

    test("...user deleted", async ({request}) => {
        const response = await request.delete(url(user.url!));
        expect(response.status()).toBe(http.NO_CONTENT);
    });
});
