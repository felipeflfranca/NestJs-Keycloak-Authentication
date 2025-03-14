import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { KeycloakTokenResponse } from './interfaces/keycloak-token.interface';

dotenv.config();

@Injectable()
export class AuthService {
  private keycloakUrl = `${process.env.KEYCLOAK_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

  async getToken(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post<KeycloakTokenResponse>(
        this.keycloakUrl,
        new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          username,
          password,
          grant_type: 'password',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      console.error('Error when logging in:', error); // Logging error
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post<KeycloakTokenResponse>(
        this.keycloakUrl,
        new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      console.error('Error performing token refresh:', error); // Logging error
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
