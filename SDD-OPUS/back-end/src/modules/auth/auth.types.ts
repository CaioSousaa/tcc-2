export interface UserDto {
  id: string;
  name: string;
  email: string;
}

export interface AuthContext {
  user: UserDto;
  sessionId: string;
}
