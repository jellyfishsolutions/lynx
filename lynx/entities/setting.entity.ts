import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import BaseEntity from "./base.entity";
import { GraphQL, GraphField } from "../graphql/decorators";

@Entity("settings")
@GraphQL()
export default class Setting extends BaseEntity {
    @PrimaryGeneratedColumn()
    @GraphField({ type: "ID" })
    id: Number;

    @Column()
    @GraphField()
    name: String;

    @Column()
    @GraphField()
    value: String;
}

