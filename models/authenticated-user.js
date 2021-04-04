export class AuthenticatedUser {
    constructor(Profile, accessToken, refreshToken) {
        this.profile = Profile;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}