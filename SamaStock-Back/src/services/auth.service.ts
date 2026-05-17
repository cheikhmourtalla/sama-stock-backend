import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env/env";
import loggerService from "../services/logger.service";

const logger = loggerService.getLogger("AuthService");

export const AuthService = {
  async login(email: string, PlainTextpassword: string) {
    logger.debug(`Tentative de connexion pour l'email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      logger.warn(`Utilisateur non trouvé avec l'email: ${email}`);
      throw new Error("Email ou mot de passe incorrect");
    }

    const { password } = user;
    
    logger.debug(`Vérification du mot de passe pour l'utilisateur: ${user.id}`);

    const isPasswordValid = await bcrypt.compare(PlainTextpassword, password);

    if (!isPasswordValid) {
      logger.warn(`Mot de passe incorrect pour l'utilisateur: ${user.id} (${email})`);
      throw new Error("Email ou mot de passe incorrect");
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(jwtPayload, env.jwt.secret as string, {
      expiresIn: "7d",
    });

    logger.info(`Connexion réussie pour l'utilisateur: ${user.id} (${email}), rôle: ${user.role}`);

    return token;
  },
};