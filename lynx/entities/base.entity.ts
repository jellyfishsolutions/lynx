import {
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity as ORMBaseEntity
} from "typeorm";

export default class BaseEntity extends ORMBaseEntity {
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    hiddenFields: string[] = [];

    public removeHiddenField(field: string) {
        if (!this.hiddenFields || this.hiddenFields.length == 0) {
            return;
        }
        let index = this.hiddenFields.indexOf(field);
        if (index != -1) {
            this.hiddenFields.splice(index, 1);
        }
    }

    public addHiddenField(field: string) {
        if (!this.hiddenFields) {
            this.hiddenFields = [];
        }
        let index = this.hiddenFields.indexOf(field);
        if (index != -1) {
            return;
        }
        this.hiddenFields.push(field);
    }

    public serialize(): any {
        let obj: any = {};
        for (let key in this) {
            if (key === "hiddenFields") {
                continue;
            }
            if (
                !this.hiddenFields ||
                (this.hiddenFields && this.hiddenFields.indexOf(key) == -1)
            ) {
                if (this[key] && (<any>this[key]).serialize) {
                    obj[key] = (<any>this[key]).serialize();
                } else {
                    obj[key] = this[key];
                }
            }
        }
        return obj;
    }
}
