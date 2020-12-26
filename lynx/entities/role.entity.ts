import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import BaseEntity from './base.entity';
import User from './user.entity';

@Entity('roles')
export default class Role extends BaseEntity {
    static readonly ADMIN = 'admin';
    static readonly ADMIN_LEVEL = 1000;
    static readonly STAFF = 'staff';
    static readonly STAFF_LEVEL = 500;

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    readableName: string;

    @Column()
    description: string;

    @Column()
    level: number;

    @ManyToMany((_) => User, (user) => user.roles)
    users: User[];
}
