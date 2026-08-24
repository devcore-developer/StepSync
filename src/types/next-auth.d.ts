import "next-auth";
import "next-auth/jwt";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      isOnboarded: boolean;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: UserRole;
    isOnboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    isOnboarded?: boolean;
  }
}