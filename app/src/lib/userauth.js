"use server";
import { redirect } from 'next/navigation';
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";

export async function validateAndCreateUser(prevState, formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        if (!email || !password || !name) {
            return { success: false, error: "Name, email, and password are required." };
        }

        if (password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters long." };
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() }).exec();
        if (existingUser) {
            return { success: false, error: "This email is already registered. Please log in." };
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        await User.create({
            name,
            email: email.toLowerCase(),
            password_hash
        });

        return { success: true, message: 'Account created successfully! You can now log in.' };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: "An unexpected error occurred during sign up." };
    }
}

export async function validateAndLoginUser(prevState, formData) {
    try {
        // NextAuth's signIn handles the database check via the authorize callback we wrote in src/auth.js
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password." };
                case "CallbackRouteError":
                    return { success: false, error: error.cause?.err?.message || "Invalid credentials." };
                default:
                    return { success: false, error: "Something went wrong." };
            }
        }
        // Re-throw so Next.js can handle the redirect upon successful login
        throw error; 
    }
}

export async function logoutUser() {
    await signOut({ redirectTo: '/userauth/login' });
    redirect('/userauth/login');
}

export async function loginStatus(required = true) {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    
    if (required && !isLoggedIn) {
        redirect('/userauth/login');
    }
    else if (!required && isLoggedIn) {
        redirect('/dashboard');
    }
    return session;
}