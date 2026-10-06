import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { RegisterDto, LoginDto, AuthResponseDto } from "../dtos/auth.dto";

export class AuthService {
  private userRepo: UserRepository;
  private jwtSecret: string;
  private jwtExpiry: string | number;

  constructor() {
    this.userRepo = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-me";
    this.jwtExpiry = process.env.JWT_EXPIRY || "30d";
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const hashedPassword = await bcryptjs.hash(dto.password, 10);
    const user = await this.userRepo.create(dto.email, hashedPassword, dto.name);

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    const isPasswordValid = await bcryptjs.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Email ou senha incorretos");
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  validateToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error("Token inválido ou expirado");
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      this.jwtSecret,
      {
        expiresIn: this.jwtExpiry,
      } as any
    );
  }
}
