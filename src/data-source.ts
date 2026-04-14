import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Ticket } from "./entity/Ticket";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH || "./data/ticketline.db",
  synchronize: true,
  logging: false,
  entities: [User, Ticket],
});
