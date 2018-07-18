import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import BaseEntity from "./base.entity";

export enum Status {
    INIT = "init",
    EXECUTED = "executed",
    FAILED = "failed"
}

@Entity("migrations")
export default class MigrationEntity extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Column({ type: "text" })
    name: string;
    @Column() status: Status;

    constructor() {
        super();
        this.status = Status.INIT;
    }

    setExecuted() {
        this.status = Status.EXECUTED;
    }
    setFailed() {
        this.status = Status.FAILED;
    }

    wasExecuted(): boolean {
        return this.status == Status.EXECUTED;
    }

    public static findByName(
        name: string
    ): Promise<MigrationEntity | undefined> {
        return MigrationEntity.findOne({ where: { name: name } });
    }
}
