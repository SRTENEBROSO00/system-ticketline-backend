import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  clientName!: string;

  @Column()
  title!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  address!: string;

  @Column()
  contracts!: string;

  @Column()
  descriptionIssue!: string;

  @Column({ default: "Pendiente" })
  status!: string;

  @Column()
  assignedTechnician!: string;

  @Column({ nullable: true, default: "" })
  technicalDescription!: string;

  @CreateDateColumn()
  creationDate!: Date;

  @Column({ nullable: true })
  solveDate!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  softDelete!: boolean;

  @ManyToOne(() => User, (user) => user.tickets)
  user!: User;
}
