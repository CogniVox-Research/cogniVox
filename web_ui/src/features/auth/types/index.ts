export type LoginInput = {
    email: string;
    password: string;
};

export type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

export type AuthResponse = {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
};
