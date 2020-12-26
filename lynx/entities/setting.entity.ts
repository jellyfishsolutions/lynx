import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import BaseEntity from './base.entity';

@Entity('settings')
export default class Setting extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    value: string;
}
