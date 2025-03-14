import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { KeycloakUserRepresentation } from './interfaces/keycloak-user.interface';
import { handleError } from 'src/utils/keycloak-error-messages';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private keycloakUrl = process.env.KEYCLOAK_SERVER_URL;
  private realm = process.env.KEYCLOAK_REALM;
  private adminTokenCache: { token: string; expiresAt: number } = null;

  constructor() {
    if (!this.keycloakUrl || !this.realm) {
      throw new Error(
        'KEYCLOAK_SERVER_URL and KEYCLOAK_REALM must be set in the environment variables.',
      );
    }
    if (
      !process.env.KEYCLOAK_ADMIN_USERNAME ||
      !process.env.KEYCLOAK_ADMIN_PASSWORD
    ) {
      throw new Error(
        'KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD must be set in the environment variables.',
      );
    }
  }

  private mapUserRepresentation(
    userData: Partial<CreateUserDto | UpdateUserDto>,
    existingUser?: KeycloakUserRepresentation,
  ): KeycloakUserRepresentation {
    const mappedUser: KeycloakUserRepresentation = {
      username: existingUser?.username ?? userData.username,
      email: userData.email ?? existingUser?.email,
      firstName: userData.firstName ?? existingUser?.firstName,
      lastName: userData.lastName ?? existingUser?.lastName,
      attributes: {
        phoneNumber:
          userData.phoneNumber ?? existingUser?.attributes?.phoneNumber,
        document: userData.document ?? existingUser?.attributes?.document,
        userType: userData.userType ?? existingUser?.attributes?.userType,
      },
    };

    if (userData.password) {
      mappedUser.credentials = [
        {
          type: 'password',
          value: userData.password,
          temporary: false,
        },
      ];
    }

    if (!existingUser) {
      mappedUser.enabled = true;
    }

    return mappedUser;
  }

  /**
   * Retrieves an admin token using `grant_type=password`, caching it to avoid redundant requests.
   */
  async getAdminToken(): Promise<string> {
    const now = Date.now();
    if (this.adminTokenCache && this.adminTokenCache.expiresAt > now) {
      return this.adminTokenCache.token;
    }

    try {
      const params = new URLSearchParams({
        client_id: 'admin-cli',
        username: process.env.KEYCLOAK_ADMIN_USERNAME,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD,
        grant_type: 'password',
      });

      const response = await axios.post<TokenResponse>(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      // Sets the expiration with a safety margin (e.g., 10 seconds less)
      const expiresAt = now + (response.data.expires_in - 10) * 1000;
      this.adminTokenCache = { token: response.data.access_token, expiresAt };

      return response.data.access_token;
    } catch (error) {
      handleError(
        this.logger,
        'Error getting token',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  /**
   * Creates a user in Keycloak and assigns client roles (keynest-server) if provided.
   */
  async createUser(user: CreateUserDto): Promise<{ userId: string }> {
    const adminToken = await this.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    };

    const data = this.mapUserRepresentation(user);

    try {
      const response = await axios.post(url, data, config);

      if (response.status !== 201) {
        throw new HttpException('Error creating user', HttpStatus.BAD_REQUEST);
      }

      // Retrieves the newly created user's ID
      const userId = await this.getUserIdByUsername(user.username);

      if (!userId) {
        throw new HttpException(
          'User created but ID not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const roles = user.roles;
      if (roles && roles.length > 0) {
        await this.assignRolesToUser(userId, roles);
      }

      return { userId };
    } catch (error) {
      handleError(
        this.logger,
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieves the user ID by username.
   */
  async getUserIdByUsername(username: string): Promise<string | null> {
    const adminToken = await this.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${encodeURIComponent(username)}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      return response.data.length > 0 ? response.data[0].id : null;
    } catch (error) {
      this.logger.error('Error fetching user', error);
      return null;
    }
  }

  /**
   * Retrieves the internal client ID from the client_id.
   */
  async getClientInternalId(clientId: string): Promise<string> {
    const adminToken = await this.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/clients?clientId=${encodeURIComponent(clientId)}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (response.data && response.data.length > 0) {
        return response.data[0].id;
      } else {
        throw new Error(`Client ${clientId} not found.`);
      }
    } catch (error) {
      handleError(
        this.logger,
        'Error getting client ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieves client role details by name.
   */
  async getClientRoleByName(
    roleName: string,
    clientInternalId: string,
  ): Promise<{ id: string; name: string } | null> {
    const adminToken = await this.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/clients/${clientInternalId}/roles/${encodeURIComponent(
      roleName,
    )}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting role from client ${clientInternalId}: ${roleName}`,
        error,
      );
      return null;
    }
  }

  /**
   * Assigns a list of client roles (keynest-server) to a user.
   */
  async assignRolesToUser(userId: string, roles: string[]): Promise<void> {
    const adminToken = await this.getAdminToken();
    // Retrieves the internal client ID of keynest-server
    const clientInternalId = await this.getClientInternalId(
      process.env.KEYCLOAK_CLIENT_ID,
    );
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/clients/${clientInternalId}`;

    try {
      const roleObjects = await Promise.all(
        roles.map((role) => this.getClientRoleByName(role, clientInternalId)),
      );
      const validRoles = roleObjects.filter((role) => role !== null);

      if (validRoles.length === 0) {
        this.logger.warn('No valid roles found to assign.');
        return;
      }

      await axios.post(url, validRoles, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      handleError(
        this.logger,
        'Error assigning roles to user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }
}
