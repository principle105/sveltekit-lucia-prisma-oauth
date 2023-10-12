import { auth, githubAuth } from "$lib/server/lucia";
import { OAuthRequestError } from "@lucia-auth/oauth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
    const storedState = cookies.get("github_oauth_state");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!storedState || !state || storedState !== state || !code) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const { getExistingUser, githubUser, createUser } =
            await githubAuth.validateCallback(code);

        const getUser = async () => {
            const existingUser = await getExistingUser();
            if (existingUser) return existingUser;

            if (!githubUser.email || !githubUser.name) return null;

            return await createUser({
                attributes: {
                    email: githubUser.email,
                    name: githubUser.name,
                },
            });
        };

        const user = await getUser();

        if (user === null) {
            return new Response(null, {
                status: 401,
            });
        }

        const session = await auth.createSession({
            userId: user.userId,
            attributes: {},
        });
        locals.auth.setSession(session);
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            },
        });
    } catch (e) {
        if (e instanceof OAuthRequestError) {
            return new Response(null, {
                status: 400,
            });
        }
        return new Response(null, {
            status: 500,
        });
    }
};
