import { Entity, PrimaryColumn, Column } from "typeorm";
import BaseEntity from "./base.entity";

export enum Status {
    INIT = "init",
    EXECUTED = "executed",
    FAILED = "failed"
}

@Entity("migrations")
export default class User extends BaseEntity {
    @PrimaryColumn({ length: 500 })
    id: string;
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
}
