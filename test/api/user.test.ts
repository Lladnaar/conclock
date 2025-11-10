import {test, expect} from "@playwright/test";
import {StatusCodes as http} from "http-status-codes";

function url(url: string) { return new URL(url, "http://localhost:8080/").href; }
let userUrl: string;

type User = {id: string; url: string; name: string; username: string; password: {url: string}};

test.beforeAll(async ({request}) => {
    const response = await request.get(url("api"));
    const body = await response.json();
    userUrl = url(body.user.url);
});

test.describe("User resource...", () => {
    test.describe.configure({mode: "serial"});

    const userData = {
        name: "Test Resource User",
        username: "test1@resource.user",
    };
    let user: User;

    test("...created", async ({request}) => {
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

    test("...exists", async ({request}) => {
        const response = await request.get(url(user.url));
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(user);
    });

    test("...updated", async ({request}) => {
        user.username = "test2@resource.user";
        delete user.password;

        const response = await request.put(url(user.url), {data: user});
        expect(response.statusText()).toBe("");
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(user);
    });

    test("...exists on list", async ({request}) => {
        const response = await request.get(userUrl);
        expect(response.status()).toBe(http.OK);

        const body = await response.json();
        expect(body).toEqual(expect.arrayContaining([expect.objectContaining({id: user.id})]));
    });

    test("...deleted", async ({request}) => {
        const response = await request.delete(url(user.url));
        expect(response.status()).toBe(http.NO_CONTENT);
    });

    test("...missing", async ({request}) => {
        const response = await request.get(url(user.url));
        expect(response.status()).toBe(http.NOT_FOUND);
    });
});

test.describe("Password...", () => {
    test.describe.configure({mode: "serial"});

    const userData = {
        name: "Password Resource User",
        username: "password@resource.user",
    };
    const password1 = "correcthorsebatterystaple";
    const password2 = "rightponycapacitornail";
    let user: User;

    test("...not yet set on new user", async ({request}) => {
        const response = await request.post(userUrl, {data: userData});
        expect(response.status()).toBe(http.CREATED);

        const body = await response.json();
        user = body;
    });

    test("...unconditionally changed", async ({request}) => {
        const password = {password: password1};
        const response = await request.post(url(user.password.url), {data: password});
        expect(response.status()).toBe(http.OK);
    });

    test("...changed with old password", async ({request}) => {
        const password = {oldPassword: password1, password: password2};
        const response = await request.post(url(user.password.url), {data: password});
        expect(response.status()).toBe(http.OK);
    });

    test("...fails to change with wrong old", async ({request}) => {
        const password = {oldPassword: password1, password: password2};
        const response = await request.post(url(user.password.url), {data: password});
        expect(response.status()).toBe(http.BAD_REQUEST);
    });

    test("...deleted", async ({request}) => {
        const response = await request.delete(url(user.url));
        expect(response.status()).toBe(http.NO_CONTENT);
    });
});

test.describe("System fails...", () => {
    test("...create without username", async ({request}) => {
        const user = {
            name: "Failing Resource User",
        };

        const response = await request.post(userUrl, {data: user});
        expect(response.status()).toBe(http.BAD_REQUEST);
    });
});
