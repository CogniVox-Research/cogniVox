export type LoginInput = {
    username: string;
    password: string;
};

export type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

export type AuthResponse = {
    access_token: string;
    token_type: string;
};
