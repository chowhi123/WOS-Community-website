import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string; // Restored for compatibility
            serverCode?: string | null;
            displayName?: string | null;
            isApprovedLeader?: boolean;
            globalRole?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        globalRole: string; // Made required as it seems to be in schema
        serverCode?: string | null;
        displayName?: string | null;
        isApprovedLeader?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role?: string;
    }
}
