import { IsEmail, Length, MinLength } from 'class-validator';
import { Field, ObjectType } from 'type-graphql';
import { Service } from 'typedi';
import { Entity, Column, Unique, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../interfaces/users.interface';

@Service()
@ObjectType()
@Entity()
@Unique(['email'])
export class UserEntity implements User {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({type: 'text', nullable: false})
  @Length(3, 20)
  userName: string;

  @Field()
  @Column({type: 'varchar', length: 255, nullable: false, unique: true})
  @MinLength(8)
  @IsEmail()
  email: string;

  @Column({type: 'text', nullable: false})
  password: string;

  @Field(() => String)
  @Column({type: 'timestamptz', nullable: false})
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @Column({type: 'timestamptz', nullable: false,})
  @UpdateDateColumn()
  updatedAt: Date;
}