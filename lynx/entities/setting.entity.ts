import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import BaseEntity from "./base.entity";
import { GraphQL, GraphField } from "../graphql/decorators";

@Entity("settings")
@GraphQL()
export default class Setting extends BaseEntity {
    @PrimaryGeneratedColumn()
    @GraphField({ type: "ID" })
    id: number;

    @Column()
    @GraphField()
    name: string;

    @Column()
    @GraphField()
    value: string;
}

