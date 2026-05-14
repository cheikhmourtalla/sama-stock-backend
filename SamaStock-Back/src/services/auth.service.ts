import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";

export const AuthService = {
  async login(email: string, PlainTextpassword: string) {
    try {
      console.log(email, PlainTextpassword)
      const user = await prisma.user.findUnique({
        where: { email: email },
      });

      console.log(email, PlainTextpassword)
      if (!user) {
        throw new Error("Email ou mot de pass incorrect");
      }

      
      //    Verify password
      
      const { password } = user;
      console.log(password)
      const isPasswordValid = await bcrypt.compare(PlainTextpassword, password);

      console.log(isPasswordValid)
    
       if (!isPasswordValid) {
        console.log("Attemps to log with invalid password");
        throw new Error("Email ou mot de pass incorrect");
      }

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(jwtPayload, "123" as string, {
        expiresIn: "7d",
      });

      console.log("User Connected");
      return token;
    } catch (error) {
      console.log(error);

      throw error;
    }
  },
};
