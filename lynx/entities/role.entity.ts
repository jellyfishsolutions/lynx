import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import BaseEntity from "./base.entity";
import User from "./user.entity";
import { GraphQL, GraphField } from "../graphql/decorators";

@Entity("roles")
@GraphQL()
export default class Role extends BaseEntity {
    static readonly ADMIN = "admin";
    static readonly ADMIN_LEVEL = 1000;
    static readonly STAFF = "staff";
    static readonly STAFF_LEVEL = 500;

    @GraphField({ type: "ID" })
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    @GraphField()
    name: string;

    @Column()
    @GraphField()
    readableName: string;

    @Column()
    @GraphField()
    description: string;

    @Column()
    @GraphField()
    level: number;

    @ManyToMany(type => User, user => user.roles)
    users: User[];
}
