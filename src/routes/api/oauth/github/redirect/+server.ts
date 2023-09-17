import { auth, githubAuth } from "$lib/server/lucia";
import type { RequestHandler } from "../$types";

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies.get("github_oauth_state");

    if (!storedState || storedState !== state || !code || !state)
        return new Response(null, { status: 401 });

    const { createUser, getExistingUser, githubUser } =
        await githubAuth.validateCallback(code);

    const existingUser = await getExistingUser();

    let user = null;

    if (githubUser.email && githubUser.name) {
        if (existingUser) {
            user = existingUser;
        } else {
            user = await createUser({
                attributes: {
                    email: githubUser.email,
                    name: githubUser.name,
                },
            });
        }
    }

    if (!user) {
        return new Response(null, { status: 401 });
    }

    const session = await auth.createSession({
        userId: user.id,
        attributes: {},
    });

    locals.auth.setSession(session);

    return new Response(null, {
        status: 302,
        headers: {
            location: "/",
        },
    });
};
