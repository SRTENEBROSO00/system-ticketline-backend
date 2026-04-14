import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Ticket } from "./Ticket";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  role!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ default: false })
  softDelete!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.user, {
    eager: true,
    cascade: true,
  })
  tickets!: Ticket[];
}
