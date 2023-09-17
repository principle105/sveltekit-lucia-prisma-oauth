import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";
import { prisma } from "@lucia-auth/adapter-prisma";
import { github } from "@lucia-auth/oauth/providers";
import client from "$lib/server/prisma";
import {
    GITHUB_ID,
    GITHUB_SECRET,
    GITHUB_REDIRECT_URL,
} from "$env/static/private";

export const auth = lucia({
    env: dev ? "DEV" : "PROD",
    middleware: sveltekit(),
    adapter: prisma(client, {
        user: "user", // model User {}
        key: "key", // model Key {}
        session: "session", // model Session {}
    }),
    getUserAttributes(databaseUser) {
        return {
            id: databaseUser.id,
            name: databaseUser.name,
            email: databaseUser.email,
        };
    },
});

export const githubAuth = github(auth, {
    clientId: GITHUB_ID,
    clientSecret: GITHUB_SECRET,
    scope: ["user:email"],
    redirectUri: GITHUB_REDIRECT_URL,
});

export type Auth = typeof auth;
