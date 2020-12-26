import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';
import BaseEntity from './base.entity';
import Role from './role.entity';
import Media from './media.entity';

let SYNCHRONIZE = true;

export function setSkipSync(skip: boolean) {
    SYNCHRONIZE = !skip;
}

@Entity('users', { synchronize: SYNCHRONIZE })
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column() password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    nickName: string;

    @ManyToMany((_) => Role, (role) => role.users, { eager: true })
    @JoinTable()
    roles: Role[];

    @OneToMany((_) => Media, (media) => media.owner)
    media: Media[];

    hiddenFields = ['password'];

    private hasRole(name: string): boolean {
        for (let role of this.roles) {
            if (role.name == name) {
                return true;
            }
        }
        return false;
    }

    get isAdmin(): boolean {
        return this.hasRole(Role.ADMIN);
    }

    get isStuff(): boolean {
        return this.hasRole(Role.STAFF);
    }

    get level(): number {
        let max = 0;
        this.roles.forEach((r) => {
            if (r.level > max) {
                max = r.level;
            }
        });
        return max;
    }
}
