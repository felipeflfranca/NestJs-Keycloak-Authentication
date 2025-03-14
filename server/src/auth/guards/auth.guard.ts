import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from 'src/roles/public.decorator';
import { ROLES_KEY } from 'src/roles/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Retrieve required roles as an array of strings
    const requiredRoles: string[] =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // If no roles are required, allow access
    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.error('Token not found or invalid format');
      throw new ForbiddenException('Token not found or invalid format');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.decode(token) as JwtPayload;

      const realmRoles = decoded?.realm_access?.roles || [];
      const resourceRoles: string[] = [];

      if (decoded?.resource_access) {
        for (const resource in decoded.resource_access) {
          if (
            Object.prototype.hasOwnProperty.call(
              decoded.resource_access,
              resource,
            ) &&
            decoded.resource_access[resource].roles
          ) {
            resourceRoles.push(...decoded.resource_access[resource].roles);
          }
        }
      }

      const userRoles = [...realmRoles, ...resourceRoles];

      // Check if the user has at least one of the required roles
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );
      if (!hasRequiredRole) {
        this.logger.error(
          `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ')}`,
        );
        throw new ForbiddenException('Access denied');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Error verifying token', error);
      throw new ForbiddenException('Invalid token');
    }
  }
}
