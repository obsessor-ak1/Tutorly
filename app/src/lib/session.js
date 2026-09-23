import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const sessionOptions = {
    password: process.env.SESSION_PASSWORD,
    cookieName: "tutorly_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    }
};

export async function getSession() {
    const cookieStore =  await cookies();
    let session = getIronSession(cookieStore, sessionOptions);
    return session;
}

