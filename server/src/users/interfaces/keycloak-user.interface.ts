export interface KeycloakUserRepresentation {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  // If you need other native Keycloak fields, you can add them here.
  attributes?: {
    phoneNumber?: string;
    document?: string;
    userType?: string;
  };
  credentials?: {
    type: string;
    value: string;
    temporary: boolean;
  }[];
}
