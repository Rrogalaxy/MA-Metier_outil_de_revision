// src/services/user.service.ts
import type { User } from "../types";
import { api } from "./http";

/**
 * Forme "API" (backend).
 * Ici je colle à votre User model Laravel :
 * email / first_name / last_name
 */
type ApiUser = {
    email: string;
    first_name: string;
    last_name: string;
    roles?: string[];
};

/** Convertit la réponse backend vers le type frontend `User`. */
function mapApiUserToUser(u: ApiUser): User {
    return {
        mail: u.email,
        prenom: u.first_name,
        nom: u.last_name,
    };
}

export async function getMe(): Promise<User> {
    // Votre backend expose déjà GET /user avec auth:sanctum
    const apiUser = await api.get<ApiUser>("/api/user");
    return mapApiUserToUser(apiUser);
}
