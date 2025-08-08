import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
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

  @Column()
  status!: string;

  @Column()
  assignedTechnician!: string;

  @Column()
  technicalDescripction!: string;

  @Column()
  creationDate!: Date;

  @Column({ nullable: true })
  solveDate!: Date;

  @Column()
  softDelete!: boolean;

  @ManyToOne(() => User, (user) => user.tickets)
  user!: User[];
}
